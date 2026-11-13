import prisma from "../prisma/client.js";
import { CONFIG_KEYS, ERR_CODES, FEATURE_TYPES, getNextOrderStatuses, ORDER_STATUS, PAYMENT_TYPES, STATUS_TYPES, STOCK_TYPES } from "../utils/constants.js";
import { calculateInvoice, generateOrderNo, getFullAddress, getShippingAmount } from "../utils/helpers.js";
import { fileService, productService } from "./index.js";
import { createPayment, razorpayInstance } from "./payment.js";
import { publishInventoryEvent } from "./inventoryAgentProducer.js";

const createOrder = async ({ name, mobile, address, city, pincode, country, state, isDiffBillAdd, billingName, billingMobile, billingAddress, billingCity, billingPincode, billingCountry, billingState, gstNo, notes, orderProducts = [], userId, shippingAmount=0 }) => {
  const totalAmount = orderProducts.reduce((a,c) => a + (c.price * c.quantity), 0) + shippingAmount;
  const payment = await createPayment({ amount: totalAmount });
  const order = await prisma.$transaction(async (tx) => {
    const errors = [];
    const order = await tx.order.create({
      data: {
        orderNo: generateOrderNo(userId),
        name, mobile, address, city, pincode, country, state, 
        isDiffBillAdd,
        billingInfo: isDiffBillAdd ? { billingName, billingMobile, billingAddress, billingCity, billingPincode, billingCountry, billingState, gstNo } : (gstNo ? { gstNo } : null), 
        notes: notes || null,
        userId,
        paymentType: PAYMENT_TYPES.ONLINE,
        status: ORDER_STATUS.PAYMENT_PENDING,
        paymentOrderId: payment.id,
        totalAmount,
        shippingAmount
      }
    })
    const dbShippingInfo = await tx.config.findUnique({where: { key: CONFIG_KEYS.SHIPPING }});
    const dbShippingCost = getShippingAmount(dbShippingInfo?.value, { country, state });
    if(dbShippingCost !== shippingAmount) {
      const err = new Error("Shipping Amount Changed");
      err.statusCode = 400;
      err.code = ERR_CODES.ORDER_VALIDATION;
      throw err;
    }
    await Promise.all(orderProducts.map(async (prod) => {
      const dbProduct = await productService.getProductById({ id: prod.productId, tx, include: {Hsn: {select: {tax: true}}} });
      if(!dbProduct || dbProduct.status === STATUS_TYPES.INACTIVE){
        errors.push(`${prod.title} not found`);
      }
      if(prod.quantity > dbProduct.stock){
        if(dbProduct.stock === 0){
          errors.push(`${prod.title} is out of stock`);
        }else{
          errors.push(`${prod.title} has only ${dbProduct.stock} available quantity`);
        }
      };
      if(prod.price !== dbProduct.price){
        errors.push(`${prod.title} price changed`);
      }
      const stock = await tx.stock.create({
        data:{
          type: STOCK_TYPES.PAYMENT_PENDING,
          productId: parseInt(prod.productId),
          quantity: -parseInt(prod.quantity)
        }
      });
      await tx.orderProducts.create({
        data: {
          orderId: order.id,
          productId: prod.productId,
          quantity: prod.quantity,
          price: prod.price,
          mrp: prod.mrp,
          tax: dbProduct?.Hsn?.tax || 0,
          stockId: stock.id
        }
      });
    }));
    if(errors.length > 0) {
      const err = new Error(errors.join(','));
      err.statusCode = 400;
      err.code = ERR_CODES.ORDER_VALIDATION;
      throw err;
    }
    return order;
  })
  return {...order, payment }
};

const getOrders = async ({ userId=null, skip=0, take=10, search=null, status=null }) => {
  const where = { 
      userId: userId ? userId : undefined,
      status: status || undefined
  };
  if(search) {
    where.OR = [
      { orderNo: { contains: search, mode: 'insensitive' } },
      { user : { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          orderProducts: {
            select: {
              productId: true,
              product: {
                select: { title: true }
              },
              price: true
            },
            orderBy: { id: 'asc' }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      }),
      prisma.order.count({
        where
      })
  ]) ;
  const files = await fileService.getFilesByFeatureIds({ feature: FEATURE_TYPES.PRODUCT, featureIds: orders.filter(i => i.orderProducts.length > 0).map(i => i.orderProducts?.[0]?.productId)});
  return {
    data: orders.map(i => ({
        id: i.id,
        name: i.name,
        orderNo: i.orderNo,
        createdAt: i.createdAt,
        status: i.status,
        title: i.orderProducts.map(i => i.product.title).join(','),
        price: i.orderProducts.reduce((a, c) => a + c.price, 0),
        address: getFullAddress(i),
        get billingAddress(){ 
          return i.isDiffBillAdd ? getFullAddress(i.billingInfo) : this.address 
        },
        filePath: files.find(f => i.orderProducts?.[0]?.productId === f.featureId)?.path || null,
        user: i.user,
        totalAmount: i.totalAmount,
        shippingAmount: i.shippingAmount,
        dispute: i.additionalInfo?.dispute || null,
        additionalInfo: i.additionalInfo || null,
      }
    )),
    totalCount
  };
}

const getOrder = async ({ userId=null, orderNo }) => {
  const where = { 
      orderNo,
      userId: userId ? userId : undefined,
  };
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      orderProducts: {
        select: {
          productId: true,
          price: true,
          quantity: true,
          tax: true,
          product: {
            select: { title: true, slug: true }
          },
        },
        orderBy: { id: 'asc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if(orders.length === 0) {
    let err =  new Error("Order Not found");
    err.statusCode = 404;
    throw err;
  }

  const order = orders[0];

  const files = await fileService.getFilesByFeatureIds({ feature: FEATURE_TYPES.PRODUCT, featureIds: order.orderProducts.map(i => i.productId)})
  const isAdmin = !userId;
  const orderStatusHistory = await prisma.orderStatusHistory.findMany({
    where: { orderId: order.id },
    select: { id:true, createdAt: true, status: true, user: isAdmin ? {select: { name: true }} : undefined, meta: true },
    orderBy: {
      createdAt: 'asc'
    }
  })
  if(order.status === ORDER_STATUS.PAYMENT_PENDING){
    await fetchOrderStatusAndUpdateDB(order.paymentOrderId);
  }
  const {totalAmountWithoutTax, totalTaxAmount} = calculateInvoice(order.orderProducts);
  return {
    name: order.name,
    orderNo: order.orderNo,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAmount: order.shippingAmount,
    totalAmountWithoutTax,
    totalTaxAmount,
    get totalProductAmount () {
      return this.totalAmount - this.shippingAmount
    },
    notes: order.notes,
    address: getFullAddress(order),
    paymentType: order.paymentType,
    get billingAddress(){ 
      const gstNo = order.billingInfo?.gstNo;
      return (order.isDiffBillAdd ? getFullAddress(order.billingInfo, true) : this.address) + `${gstNo ? `, GST No: ${gstNo}` : ''}`;
    },
    products: order.orderProducts.map(i => ({
      slug: i.product.slug,
      title: i.product.title,
      price: i.price,
      quantity: i.quantity,
      tax: i.tax,
      img: files.filter(f => f.featureId === i.productId).map( i => ({path: i.path}))?.[0]?.path || null
    })),
    user: order.user,
    orderStatusHistory,
    additionalInfo: order.additionalInfo,
    dispute: order.additionalInfo?.dispute || null
  };
}

const raiseDispute = async ({ orderNo, userId, userName, message }) => {
  const order = await prisma.order.findFirst({
    where: {
      orderNo,
      userId,
    },
    select: {
      id: true,
      orderNo: true,
      additionalInfo: true,
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    }
  });

  if(!order) {
    const err = new Error("Order Not found");
    err.statusCode = 404;
    throw err;
  }

  const existingDispute = order.additionalInfo?.dispute || null;
  const isEditingOpenDispute = existingDispute?.status === "OPEN";

  const dispute = {
    message,
    status: existingDispute?.status || "OPEN",
    createdAt: existingDispute?.createdAt || new Date().toISOString(),
    raisedByUserId: existingDispute?.raisedByUserId || userId,
    raisedByName: existingDispute?.raisedByName || userName || order.user?.name || "",
    ...(isEditingOpenDispute ? { updatedAt: new Date().toISOString() } : {}),
  };

  const additionalInfo = {
    ...(order.additionalInfo || {}),
    dispute,
  };

  const updatedOrder = await prisma.order.update({
    where: { orderNo },
    data: { additionalInfo },
    select: {
      orderNo: true,
      additionalInfo: true,
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  return {
    ...updatedOrder,
    dispute,
    isEditing: isEditingOpenDispute,
  };
}

const updateOrderStatus = async ({ orderNo, status, userId, meta = null }) => {
  return await prisma.$transaction(async (tx) => {
      const dbOrder = await tx.order.findUnique({
        where: {
          orderNo
        }
      });
      if(!dbOrder) {
        let err =  new Error("Order Not found");
        err.statusCode = 404;
        throw err;
      }
      if(!getNextOrderStatuses(dbOrder.status).includes(status)){
        let err =  new Error(`Order is ${dbOrder.status}, cannot be changed to ${status} !`);
        err.statusCode = 403;
        throw err;
      }
      const promises = [
        tx.order.update({
          where: {
            orderNo
          },
          data: {
            status
          },
          include: { user: { select: {name: true, email: true}}}
        }),
        tx.orderStatusHistory.create({ 
            data: { orderId: dbOrder.id, status, userId, meta }
        })
      ];
      if(status === ORDER_STATUS.REJECTED){
        updateOrderProductStockStatus({tx, orderId: dbOrder.id, status: STOCK_TYPES.WITHDRAW })
      }
      const [order] = await Promise.all(promises); 
      return order
  })
}

const updateOrder = async ({ orderNo, additionalInfo }) => {
  const order = await prisma.order.update({
    where: {
      orderNo
    },
    data: {
      additionalInfo
    },
  });
  if(!order){
    let err =  new Error("Order Not found");
    err.statusCode = 404;
    throw err;
  }
  return order;
}

const updateOrderProductStockStatus = async ({ tx, orderId, status }) => {
  return await tx.$queryRaw`
    update "Stock" s set "type" = ${status}
    from "OrderProducts" op 
    where s.id = op."stockId" and op."orderId" = ${orderId};
  `
}

const updateOrderStatusByPaymentId = async ({ paymentOrderId, status, stockStatus}) => {
  try {
    const { order, isFirstPlacedTransition, productsToNotify } = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { paymentOrderId },
        select: { id: true, status: true },
      });
      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const isFirstPlacedTransition = existingOrder.status !== ORDER_STATUS.PLACED && status === ORDER_STATUS.PLACED;

      const order = await tx.order.update({
        data: { status },
        where: { paymentOrderId },
        include: {
          user: { select: { name: true, email: true } },
          orderProducts: {
            include: {
              product: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
      });

      await updateOrderProductStockStatus({ tx, orderId: order.id, status: stockStatus });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status, userId: order.userId },
      });

      let productsToNotify = [];
      if (isFirstPlacedTransition) {
        for (const op of order.orderProducts) {
          const currentStock = await productService.getProductStockById({ productId: op.productId, tx });
          productsToNotify.push({
            slug: op.product.slug,
            productName: op.product.title,
            currentStock,
            reorderThreshold: 10,
          });
        }
      }

      return { order, isFirstPlacedTransition, productsToNotify };
    });

    // Once payment has succeeded (order transitioned to PLACED), dispatch low stock event to Kafka multi-agent system
    if (isFirstPlacedTransition && productsToNotify.length > 0) {
      for (const item of productsToNotify) {
        console.log(`[OrderPayment] Payment succeeded for order. Dispatched stock event for "${item.productName}" (Remaining stock: ${item.currentStock}, Threshold: ${item.reorderThreshold})`);
        publishInventoryEvent({
          slug: item.slug,
          productName: item.productName,
          sku: item.slug,
          currentStock: item.currentStock,
          reorderThreshold: item.reorderThreshold,
        }).catch((err) => console.warn('[InventoryAgent] Event emit error on payment success:', err.message));
      }
    }

    return order;
  } catch (error) {
    console.error("Error in updateOrderStatusByPaymentId:", error);
    throw error;
  }
};

const fetchOrderStatusAndUpdateDB = async (paymentOrderId) => {
  const razorpayOrder = await razorpayInstance.orders.fetch(paymentOrderId);
  if(razorpayOrder.status === 'paid'){
    await updateOrderStatusByPaymentId({ paymentOrderId, status: ORDER_STATUS.PLACED, stockStatus: STOCK_TYPES.ORDER});
  }
}

const getOrderStats = async () => {
  const statusStats = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  const totalCount = statusStats.reduce((a,c) => a + c._count.status, 0);
  const orderStatus = statusStats.map(i => ({ label: i.status, value: i._count.status })).concat({ label: 'ALL', value: totalCount }).reduce((acc, curr) => {
    acc[curr.label] = curr.value;
    return acc;
  }, {});
  return { orderStatus }
}

export default {
  createOrder,
  getOrders,
  getOrder,
  raiseDispute,
  updateOrderStatus,
  updateOrderProductStockStatus,
  updateOrderStatusByPaymentId,
  updateOrder,
  getOrderStats
};
