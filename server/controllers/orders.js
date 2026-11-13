import { errorHandler } from "../utils/errorHandler.js";
import orderService from "../services/orders.js"
import { ORDER_STATUS, STOCK_TYPES } from "../utils/constants.js";
import crypto from 'crypto';
import { sendOrderDisputeMail, sendOrderStatusMail } from "../utils/helpers.js";

const createOrder = async (req, res) => {
  try {
    const data = await orderService.createOrder({...req.body, userId: req.user.id});
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
      return errorHandler(err, res);
  }
};

const getOrdersByUserId = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber || 1);
    const pageSize = parseInt(req.query.pageSize || 5);
    const skip = (page - 1) * pageSize;
    const { data, totalCount} = await orderService.getOrders({
      userId: req.user.id,
      skip,
      take: pageSize,
      search: req.query.search,
      status: req.query.status,
    });
    return res.status(200).json({
      success: true,
      data,
      totalCount
    });
  } catch (err) {
      return errorHandler(err, res);
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber || 1);
    const pageSize = parseInt(req.query.pageSize || 10);
    const skip = (page - 1) * pageSize;

    const { data, totalCount} = await orderService.getOrders({ skip, take: pageSize, search: req.query.search, status: req.query.status });
    return res.status(200).json({
      success: true,
      data,
      totalCount
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getOrderBySlugAdmin = async (req, res) => {
  try {
    const data = await orderService.getOrder({ orderNo: req.params.slug });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getOrderBySlugUser = async (req, res) => {
  try {
    const data = await orderService.getOrder({ orderNo: req.params.slug, userId: req.user.id });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderNo = req.params.slug;
    const data = await orderService.updateOrderStatus({ orderNo, userId: req.user.id, ...req.body });
    sendOrderStatusMail({ email: data.user.email,userName: data.user.name, orderNo: data.orderNo, status: data.status  });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateOrder = async (req, res) => {
  try {
    const orderNo = req.params.slug;
    const data = await orderService.updateOrder({ orderNo, userId: req.user.id, ...req.body });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const raiseDispute = async (req, res) => {
  try {
    const orderNo = req.params.slug;
    const data = await orderService.raiseDispute({
      orderNo,
      userId: req.user.id,
      userName: req.user.name,
      message: req.body.message,
    });
    sendOrderDisputeMail({
      orderNo: data.orderNo,
      customerName: data.user?.name || req.user.name,
      message: data.dispute.message,
      isEditing: data.isEditing,
      updatedAt: data.dispute.updatedAt || null,
    });
    return res.status(200).json({
      success: true,
      message: data.isEditing ? "Dispute updated successfully." : "Dispute raised successfully.",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  try {
  
    const body = razorpay_order_id + "|" + razorpay_payment_id;
  
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
  
    if (expectedSignature === razorpay_signature) {
      const order = await orderService.updateOrderStatusByPaymentId({ paymentOrderId: razorpay_order_id, status: ORDER_STATUS.PLACED, stockStatus: STOCK_TYPES.ORDER});
      sendOrderStatusMail({ email: order.user.email,userName: order.user.name, orderNo: order.orderNo, status: ORDER_STATUS.PLACED  });
      res.json({ success: true, message: "Payment verified" });
    } else {
      throw new Error("Signature not verified");
    }
  } catch (error) {
    const order = await orderService.updateOrderStatusByPaymentId({ paymentOrderId: razorpay_order_id, status: ORDER_STATUS.PAYMENT_FAILED, stockStatus: STOCK_TYPES.WITHDRAW});
    sendOrderStatusMail({ email: order.user.email,userName: order.user.name, orderNo: order.orderNo, status: ORDER_STATUS.PAYMENT_FAILED  });
    res.status(400).json({ success: false, message: "Payment Failed" });
  }
};

const getOrderStatsAdmin = async (req, res) => {
  try {
    const data = await orderService.getOrderStats();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};



export default {
  createOrder,
  getOrdersByUserId,
  getAdminOrders,
  getOrderBySlugAdmin,
  getOrderBySlugUser,
  updateOrderStatus,
  verifyPayment,
  updateOrder,
  raiseDispute,
  getOrderStatsAdmin
};
