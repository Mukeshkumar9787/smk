import prisma, { PrismaConfig } from "../prisma/client.js";

import { ERR_CODES, FEATURE_TYPES, STOCK_TYPES, STATUS_TYPES } from "../utils/constants.js";
import { convertToFullFilePath, deleteFiles, slugText } from "../utils/helpers.js";
import { sendMail } from "../utils/mailUtils.js";
import { fileService } from "./index.js";

/**
 * Create Product
 */
const createProduct = async ({ title, description, fileIds, deletedFileIds, categoryId, hsnId, mrp, price, stock, status, sizeId, colorId, variant }) => {
  let product = null;

  await prisma.$transaction( async (tx) => {
    product = await tx.Product.create({ data: { title, description: description || null, slug: slugText(title), categoryId, hsnId, mrp, price, status, sizeId, colorId, variant }});
    await tx.stock.create({ data: { type: STOCK_TYPES.PRODUCT, productId: product.id, quantity: stock } })
    await fileService.updateFilesByIds({ tx, feature: FEATURE_TYPES.PRODUCT, featureId: product.id, fileIds, deletedFileIds })
  })

  return product;
};

/**
 * Get all Products
 */
const getProducts = async ({ status, pageNumber=1, pageSize=10, search='', color, category, size, 'productIds[]': productIds = null, pagination = true, variant }) => {
  const conditions = [];

  if (productIds) {
    if(typeof(productIds) === 'string'){
      conditions.push(PrismaConfig.sql`p.id = ${productIds}`);
    }else{
      let productIdSql = productIds.map(id => PrismaConfig.sql`${id}`)
      conditions.push(PrismaConfig.sql`p.id in (${PrismaConfig.join(productIdSql,`,`)})`);
    }
  }

  if (status) {
    conditions.push(PrismaConfig.sql`p.status = ${status}`);
  }

  if (color) {
    conditions.push(PrismaConfig.sql`color.code = ${color}`);
  }

  if (category) {
    conditions.push(PrismaConfig.sql`c.slug = ${category}`);
  }

  
  if (size) {
    conditions.push(PrismaConfig.sql`s.title = ${size}`);
  }
  
  if (variant) {
    conditions.push(PrismaConfig.sql`p.variant = ${variant}`);
  }
  
  if(search) {
    const searchText = `%${search}%`;
    conditions.push(
      PrismaConfig.sql`(
        p.title ilike ${searchText}
        OR COALESCE(p.description, '') ilike ${searchText}
        OR COALESCE(c.title, '') ilike ${searchText}
      )`
    );
  }

  const whereClause =
    conditions.length
      ? PrismaConfig.sql`WHERE ${PrismaConfig.join(conditions,` AND `)}`
      : PrismaConfig.empty;
  
  const offset = (pageNumber - 1) * pageSize;

  let paginationClause = PrismaConfig.empty;
  if(pagination){
    paginationClause = PrismaConfig.sql`OFFSET ${offset} LIMIT ${pageSize}`;
  }

  const [products, totalCount] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        p.id,
        p.title,
        p.description,
        p.status,
        p.slug,
        p.mrp,
        p.price,
        p.variant,
        c.title as "categoryName",
        s.title as "sizeName",
        color.code as "colorCode",
        COALESCE((
          SELECT AVG(pr.rating)
          FROM "ProductReview" pr
          WHERE pr."productId" = p."id" AND pr."isHidden" = false
        ), 0) as "avgRating",
        (
          SELECT COUNT(1)
          FROM "ProductReview" pr
          WHERE pr."productId" = p."id" AND pr."isHidden" = false
        )::int as "reviewCount",
        (select f."path"  from "File" f where f.feature = ${FEATURE_TYPES.PRODUCT} and f."featureId" = p."id" order by f."createdAt" asc limit 1) as img
      FROM "Product" p
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Size" s ON s."id" = p."sizeId"
      LEFT JOIN "Color" color ON color."id" = p."colorId"
      ${whereClause}
      ORDER BY p."createdAt" DESC
      ${paginationClause} ;
    `,
    pagination 
    ? 
    prisma.$queryRaw`
      SELECT COUNT(1)
      FROM "Product" p 
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Size" s ON s."id" = p."sizeId"
      LEFT JOIN "Color" color ON color."id" = p."colorId"
      ${whereClause}
    `
    : [{ count: 0 }]
  ]);
  const finalProducts = await Promise.all(products.map(async i => 
    ({...i, 
      img: convertToFullFilePath(i.img), 
      stock: await getProductStockById({ productId: i.id})
    })));
  return { 
    products: finalProducts,
    totalCount: parseInt(totalCount[0].count)
  }
};

/**
 * Get single Product
 */
const getProductBySlug = async (slug, options = {}) => {
  const { allowInactive = false } = options;
  const product = await prisma.product.findUnique({
    where: {
      slug,
      ...(allowInactive ? {} : { status: STATUS_TYPES.ACTIVE })
    },
    include: {
      Color: {
        select: {
          code: true
        }
      },
      Size: {
        select: {
          title: true
        }
      }
    }
  });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  const [stockQty, images, reviewAgg] = await Promise.all([
      getProductStockById({ productId: product.id}),
      prisma.file.findMany({
      select: {
        id: true,
        path: true
      },
      where: {
        feature: FEATURE_TYPES.PRODUCT,
        featureId: product.id
      },
      orderBy: [{ createdAt: 'asc' }]
    }),
    prisma.productReview.aggregate({
      where: {
        productId: product.id,
        isHidden: false,
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);
  product.images = images.map(i => {
    i.path = convertToFullFilePath(i.path);
    return i;
  });
  product.colorCode = product.Color.code;
  product.sizeTitle = product.Size.title;
  product.stock = stockQty;
  product.avgRating = Number(reviewAgg?._avg?.rating || 0);
  product.reviewCount = Number(reviewAgg?._count?._all || 0);
  product.Color = undefined;
  product.Size = undefined;
  return product;
};

/**
 * Update Product
 */
const updateProduct = async (id, { title, description, fileIds, deletedFileIds, categoryId, hsnId, mrp, price, stock, status, sizeId, colorId, variant, oldStockQty }) => {
  let updated = null;
  let deletedFiles = [];
  let shouldSendRestockNotification = false;
  let restockProductInfo = null;
  
  
  await prisma.$transaction(async (tx) => {
    const dbStockQty = await getProductStockById({ productId: id, tx });
    if(dbStockQty !== oldStockQty){
      const err = new Error(`Current Stock changed ${oldStockQty} to ${dbStockQty}. Stock resetted to current stock, Please check and Change it again...!`);
      err.statusCode = 400;
      err.code = ERR_CODES.STOCK_CHANGED;
      err.data = { currentStockQty : dbStockQty };
      throw err;
    }
    let deletedRecords;
    const promises = [
      tx.Product.update({
        where: { id },
        data: {
          title,
          description: description || null,
          slug: slugText(title),
          categoryId, hsnId, mrp: parseFloat(mrp), price: parseFloat(price),
          status, sizeId, colorId, variant
        },
      }),
      fileService.updateFilesByIds({ tx, feature: FEATURE_TYPES.PRODUCT, featureId: id, fileIds, deletedFileIds })
    ];
    if(dbStockQty !== stock) {
      promises.push(
        tx.stock.create({ data: { type: STOCK_TYPES.PRODUCT, productId: id, quantity: stock - dbStockQty } }),
      )
    }
    [updated, { deletedRecords }] = await Promise.all(promises);
    if (!updated) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      err.data = {stockQty: dbStockQty}
      throw err;
    }
    shouldSendRestockNotification = dbStockQty <= 0 && Number(stock) > 0;
    restockProductInfo = shouldSendRestockNotification ? { id: updated.id, title: updated.title, slug: updated.slug } : null;
    deletedFiles = deletedRecords;
  })
  deleteFiles(deletedFiles);
  if (shouldSendRestockNotification && restockProductInfo) {
    sendRestockNotifications(restockProductInfo);
  }
  return updated;
};

/**
 * Soft delete Product
 */
const deleteProduct = async (id) => {
  const deleted = await prisma.Product.delete({
    where: { id },
  });

  if (!deleted) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: deleted.id,
  };
};

const getProductStockById = async({ productId, tx = prisma }) => {
  const productStock = await tx.$queryRaw`
      SELECT GREATEST(COALESCE(SUM(COALESCE(quantity, 0)), 0), 0) as stock
      FROM "Stock"
      WHERE
        "productId" = ${productId}
        AND (
          type NOT IN (${STOCK_TYPES.PAYMENT_PENDING}, ${STOCK_TYPES.WITHDRAW})
          OR (
            type = ${STOCK_TYPES.PAYMENT_PENDING}
            AND "createdAt" > NOW() - INTERVAL '5 minutes'
          )
        )
    `;
  return parseInt(productStock[0].stock)
}

const getProductById = async({ id, tx = prisma, include= null }) => {
  const [product, stock ] = await Promise.all([
    tx.product.findUnique({
      include: include || undefined,
      where: { id }
    }),
    getProductStockById({ productId: id, tx })
  ])
  if(!product) return null
  return { ...product, stock }
}

const subscribeProductRestockNotification = async ({ productId, user }) => {
  const product = await getProductById({ id: productId });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  if (product.stock > 0) {
    return { alreadyAvailable: true, message: "Product is already in stock." };
  }

  await prisma.productNotification.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
    update: {
      email: user.email,
      notified: false,
      notifiedAt: null,
    },
    create: {
      userId: user.id,
      productId,
      email: user.email,
      notified: false,
    },
  });

  return { message: "You will be notified when this product is back in stock." };
};

const getProductReviews = async ({ productId, includeHidden = false }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const reviews = await prisma.productReview.findMany({
    where: {
      productId,
      isHidden: includeHidden ? undefined : false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return reviews;
};

const getProductReviewByUser = async ({ productId, userId }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const reviews = await prisma.productReview.findMany({
    where: { userId, productId },
    orderBy: [{ createdAt: "desc" }],
  });

  return reviews;
};

const getProductReviewStats = async (productId) => {
  const agg = await prisma.productReview.aggregate({
    where: {
      productId,
      isHidden: false,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });
  return {
    avgRating: Number(agg?._avg?.rating || 0),
    reviewCount: Number(agg?._count?._all || 0),
  };
};

const addOrUpdateProductReview = async ({ productId, userId, rating, comment = "" }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const review = await prisma.productReview.create({
    data: {
      userId,
      productId,
      rating,
      comment: comment || null,
      isHidden: false,
    },
  });

  const stats = await getProductReviewStats(productId);
  return { review, ...stats };
};

const updateProductReviewByUser = async ({ reviewId, userId, rating, comment = "" }) => {
  const review = await prisma.productReview.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.userId !== userId) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  const updatedReview = await prisma.productReview.update({
    where: { id: reviewId },
    data: {
      rating,
      comment: comment || null,
      isHidden: false,
    },
  });

  const stats = await getProductReviewStats(review.productId);
  return { review: updatedReview, ...stats };
};

const deleteProductReviewByUser = async ({ reviewId, userId }) => {
  const review = await prisma.productReview.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.userId !== userId) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.productReview.delete({
    where: { id: review.id },
  });

  const stats = await getProductReviewStats(review.productId);
  return { reviewId: review.id, ...stats };
};

const updateProductReviewVisibility = async ({ reviewId, isHidden }) => {
  const review = await prisma.productReview.update({
    where: { id: reviewId },
    data: { isHidden },
  });
  return review;
};

const sendRestockNotifications = async ({ id, title, slug }) => {
  const subscriptions = await prisma.productNotification.findMany({
    where: {
      productId: id,
      notified: false,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const image = await prisma.file.findFirst({
    where: {
      feature: FEATURE_TYPES.PRODUCT,
      featureId: id,
    },
    orderBy: [{ createdAt: "asc" }],
  });
  const imageUrl = image?.path ? convertToFullFilePath(image.path) : "";
  if (!subscriptions.length) return;

  const baseUrl = process.env.FRONTEND_URL || "";
  const productPath = `/shop-details/${slug}`;
  const productUrl = baseUrl ? `${baseUrl}${productPath}` : "";


  await Promise.all(
    subscriptions.map(async (subscription) => {
      const to = subscription.email || subscription.user?.email;
      if (!to) return;

      const userName = subscription.user?.name || "Customer";
      const result = await sendMail({
        to,
        subject: `${title} is back in stock`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hi ${userName},</p>
            <p><strong>${title}</strong> is now back in stock.</p>
            ${productUrl
              ? `<p>You can place your order here:</p><p><a href="${productUrl}" target="_blank" rel="noreferrer">${productUrl}</a></p><p style="margin-top:12px;"><a href="${productUrl}" target="_blank" rel="noreferrer" style="display:inline-flex;padding:10px 24px;border-radius:6px;background:#000;color:#fff;text-decoration:none;">View Product</a></p>`
              : `<p>Please open the store and search for "${title}" to place your order.</p>`}
            <p>Thanks,<br/>SMK Team</p>
          </div>
        `,
      });

      if (result?.success) {
        await prisma.productNotification.update({
          where: { id: subscription.id },
          data: {
            notified: true,
            notifiedAt: new Date(),
          },
        });
      }
    })
  );
};

/**
 * Restock / create stock for a product upon PO approval or manual restock.
 */
const restockProduct = async ({ slug, productId, quantity, poNumber = null }) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const err = new Error("Invalid restock quantity. Must be a positive integer.");
    err.statusCode = 400;
    throw err;
  }
  if (qty >= 20) {
    const err = new Error("Quantity of products to be added should be less than 20.");
    err.statusCode = 400;
    throw err;
  }

  let product = null;
  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: parseInt(productId, 10) },
      select: { id: true, title: true, slug: true, status: true },
    });
  }
  if (!product && slug) {
    const trimmedSlug = String(slug).trim();
    product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: trimmedSlug },
          { slug: { equals: trimmedSlug, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, slug: true, status: true },
    });
    if (!product && (trimmedSlug.toUpperCase().startsWith("PROD-") || trimmedSlug.toUpperCase().startsWith("PROD_"))) {
      const parsedId = parseInt(trimmedSlug.replace(/PROD[-_]/i, ""), 10);
      if (!isNaN(parsedId)) {
        product = await prisma.product.findUnique({
          where: { id: parsedId },
          select: { id: true, title: true, slug: true, status: true },
        });
      }
    }
    if (!product && /^\d+$/.test(trimmedSlug)) {
      const parsedId = parseInt(trimmedSlug, 10);
      product = await prisma.product.findUnique({
        where: { id: parsedId },
        select: { id: true, title: true, slug: true, status: true },
      });
    }
    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          title: { equals: trimmedSlug, mode: 'insensitive' },
        },
        select: { id: true, title: true, slug: true, status: true },
      });
    }
  }

  if (!product) {
    const err = new Error(`Product not found for identifier: '${slug || productId}'`);
    err.statusCode = 404;
    throw err;
  }

  const previousStock = await getProductStockById({ productId: product.id });

  // Create Stock record with type PRODUCT (increments stock in inventory queries)
  const stockRecord = await prisma.stock.create({
    data: {
      type: STOCK_TYPES.PRODUCT,
      productId: product.id,
      quantity: qty,
    },
  });

  const currentStock = await getProductStockById({ productId: product.id });

  // If previous stock was 0, send restock email notifications to subscribed users
  if (previousStock === 0) {
    try {
      await sendRestockNotifications({
        id: product.id,
        title: product.title,
        slug: product.slug,
      });
    } catch (notifyErr) {
      console.warn(`[Restock] Notification error for product ${product.id}:`, notifyErr.message);
    }
  }

  console.log(`[Restock] Successfully added ${qty} units for "${product.title}" (ID: ${product.id}). Stock: ${previousStock} -> ${currentStock}. PO: ${poNumber || 'N/A'}`);

  return {
    productId: product.id,
    title: product.title,
    slug: product.slug,
    addedQuantity: qty,
    previousStock,
    currentStock,
    stockId: stockRecord.id,
    poNumber,
  };
};

export default {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getProductStockById,
  getProductById,
  subscribeProductRestockNotification,
  getProductReviews,
  getProductReviewByUser,
  addOrUpdateProductReview,
  updateProductReviewByUser,
  deleteProductReviewByUser,
  updateProductReviewVisibility,
  restockProduct,
};
