import prisma, { PrismaConfig, rawPrisma } from "../prisma/client.js";
import { convertToFullFilePath } from "../utils/helpers.js";
import { ORDER_STATUS, STOCK_TYPES, STATUS_TYPES } from "../utils/constants.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";
import orderService from "./orders.js";

const SALES_STATUSES = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

const SIX_MONTH_KEYS = Array.from({ length: 6 }, (_, index) => {
  const date = new Date();
  date.setMonth(date.getMonth() - (5 - index), 1);
  date.setHours(0, 0, 0, 0);

  return {
    key: `${date.getFullYear()}-${date.getMonth() + 1}`,
    label: date.toLocaleDateString("en-IN", { month: "short" }),
    revenue: 0,
    orders: 0,
  };
});

const getStockExpression = () => PrismaConfig.sql`
  GREATEST(COALESCE((
    SELECT SUM(COALESCE(s.quantity, 0))
    FROM "Stock" s
    WHERE s."productId" = p.id
      AND (
        s.type NOT IN (${STOCK_TYPES.PAYMENT_PENDING}, ${STOCK_TYPES.WITHDRAW})
        OR (
          s.type = ${STOCK_TYPES.PAYMENT_PENDING}
          AND s."createdAt" > NOW() - INTERVAL '5 minutes'
        )
      )
  ), 0), 0)
`;

const getAdminDashboard = async () => {
  const tenantId = getCurrentTenantId();
  const salesStatusesSql = PrismaConfig.join(
    SALES_STATUSES.map((status) => PrismaConfig.sql`${status}`),
    ", "
  );

  const [
    salesAgg,
    totalOrders,
    totalProducts,
    activeProducts,
    totalUsers,
    stockAgg,
    restockRequestCount,
    statusStats,
    salesTrendRows,
    recentOrders,
    lowStockRows,
    topProductRows,
    recentCustomerRows,
    categoryRows,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { in: SALES_STATUSES },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: STATUS_TYPES.ACTIVE } }),
    rawPrisma.tenantMembership.count({ where: { tenantId } }),
    prisma.$queryRaw`
      SELECT
        COALESCE(SUM(stock_qty), 0)::INT AS "stockUnits",
        COUNT(*) FILTER (WHERE stock_qty <= 0)::INT AS "outOfStockCount",
        COUNT(*) FILTER (WHERE stock_qty > 0 AND stock_qty <= 5)::INT AS "lowStockCount"
      FROM (
        SELECT
          p.id,
          ${getStockExpression()}::INT AS stock_qty
        FROM "Product" p
        WHERE p."tenantId" = ${tenantId}
      ) stock_summary;
    `,
    prisma.productNotification.count({
      where: { notified: false },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.$queryRaw`
      SELECT
        EXTRACT(YEAR FROM DATE_TRUNC('month', o."createdAt"))::INT AS year,
        EXTRACT(MONTH FROM DATE_TRUNC('month', o."createdAt"))::INT AS month,
        COALESCE(SUM(o."totalAmount"), 0)::FLOAT AS revenue,
        COUNT(*)::INT AS orders
      FROM "Order" o
      WHERE o."tenantId" = ${tenantId}
        AND o.status IN (${salesStatusesSql})
        AND o."createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', o."createdAt")
      ORDER BY DATE_TRUNC('month', o."createdAt") ASC;
    `,
    orderService.getOrders({ skip: 0, take: 8 }),
    prisma.$queryRaw`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.status,
        c.title AS "categoryName",
        ${getStockExpression()}::INT AS stock,
        COALESCE((
          SELECT COUNT(1)
          FROM "ProductNotification" pn
          WHERE pn."productId" = p.id
            AND pn."tenantId" = ${tenantId}
            AND pn.notified = false
        ), 0)::INT AS "restockRequests",
        (
          SELECT f.path
          FROM "File" f
          WHERE f.feature = 'PRODUCT'
            AND f."featureId" = p.id
            AND f."tenantId" = ${tenantId}
          ORDER BY f."createdAt" ASC
          LIMIT 1
        ) AS img
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."tenantId" = ${tenantId}
        AND ${getStockExpression()} <= 5
      ORDER BY stock ASC, p."updatedAt" DESC
      LIMIT 6;
    `,
    prisma.$queryRaw`
      SELECT
        p.id,
        p.title,
        p.slug,
        c.title AS "categoryName",
        ${getStockExpression()}::INT AS stock,
        COALESCE(SUM(op.quantity) FILTER (WHERE o.id IS NOT NULL), 0)::INT AS "unitsSold",
        COALESCE(SUM(op.quantity * op.price) FILTER (WHERE o.id IS NOT NULL), 0)::FLOAT AS revenue,
        (
          SELECT f.path
          FROM "File" f
          WHERE f.feature = 'PRODUCT'
            AND f."featureId" = p.id
            AND f."tenantId" = ${tenantId}
          ORDER BY f."createdAt" ASC
          LIMIT 1
        ) AS img
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "OrderProducts" op ON op."productId" = p.id AND op."tenantId" = ${tenantId}
      LEFT JOIN "Order" o ON o.id = op."orderId" AND o."tenantId" = ${tenantId} AND o.status IN (${salesStatusesSql})
      WHERE p."tenantId" = ${tenantId}
      GROUP BY p.id, p.title, p.slug, c.title
      ORDER BY "unitsSold" DESC, revenue DESC, p."updatedAt" DESC
      LIMIT 5;
    `,
    prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        tm."createdAt",
        COUNT(o.id) FILTER (WHERE o.status IN (${salesStatusesSql}))::INT AS "salesOrders",
        COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status IN (${salesStatusesSql})), 0)::FLOAT AS "totalSpend"
      FROM "TenantMembership" tm
      INNER JOIN "User" u ON u.id = tm."userId"
      LEFT JOIN "Order" o ON o."userId" = u.id AND o."tenantId" = ${tenantId}
      WHERE tm."tenantId" = ${tenantId}
      GROUP BY u.id, u.name, u.email, tm."createdAt"
      ORDER BY tm."createdAt" DESC
      LIMIT 6;
    `,
    prisma.$queryRaw`
      SELECT
        c.title AS "categoryName",
        COALESCE(SUM(op.quantity) FILTER (WHERE o.id IS NOT NULL), 0)::INT AS "unitsSold",
        COALESCE(SUM(op.quantity * op.price) FILTER (WHERE o.id IS NOT NULL), 0)::FLOAT AS revenue
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c.id AND p."tenantId" = ${tenantId}
      LEFT JOIN "OrderProducts" op ON op."productId" = p.id AND op."tenantId" = ${tenantId}
      LEFT JOIN "Order" o ON o.id = op."orderId" AND o."tenantId" = ${tenantId} AND o.status IN (${salesStatusesSql})
      WHERE c."tenantId" = ${tenantId}
      GROUP BY c.id, c.title
      ORDER BY revenue DESC, "unitsSold" DESC, c.title ASC
      LIMIT 6;
    `,
  ]);

  const totalSales = Number(salesAgg._sum.totalAmount || 0);
  const salesOrderCount = Number(salesAgg._count.id || 0);
  const stockSummary = stockAgg?.[0] || {};

  const salesTrendMap = new Map(
    salesTrendRows.map((row) => [
      `${row.year}-${row.month}`,
      {
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
      },
    ])
  );

  const salesTrend = SIX_MONTH_KEYS.map((month) => ({
    ...month,
    revenue: salesTrendMap.get(month.key)?.revenue || 0,
    orders: salesTrendMap.get(month.key)?.orders || 0,
  }));

  const orderStatus = statusStats.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});
  orderStatus.ALL = Object.values(orderStatus).reduce((sum, value) => sum + Number(value || 0), 0);

  const stockBuckets = [
    { label: "Out of Stock", value: Number(stockSummary.outOfStockCount || 0), color: "#d92d20" },
    { label: "Low Stock", value: Number(stockSummary.lowStockCount || 0), color: "#f79009" },
    {
      label: "Healthy",
      value:
        Math.max(
          Number(totalProducts || 0) -
            Number(stockSummary.outOfStockCount || 0) -
            Number(stockSummary.lowStockCount || 0),
          0
        ),
      color: "#1570ef",
    },
  ];

  return {
    overview: {
      totalSales,
      salesOrderCount,
      averageOrderValue: salesOrderCount ? totalSales / salesOrderCount : 0,
      totalOrders,
      totalProducts,
      activeProducts,
      totalUsers,
      stockUnits: Number(stockSummary.stockUnits || 0),
      outOfStockCount: Number(stockSummary.outOfStockCount || 0),
      lowStockCount: Number(stockSummary.lowStockCount || 0),
      restockRequestCount,
    },
    salesTrend,
    orderStatus,
    stockBuckets,
    recentOrders: recentOrders.data,
    lowStockProducts: lowStockRows.map((item) => ({
      ...item,
      img: item.img ? convertToFullFilePath(item.img) : null,
      stock: Number(item.stock || 0),
      restockRequests: Number(item.restockRequests || 0),
    })),
    topProducts: topProductRows.map((item) => ({
      ...item,
      img: item.img ? convertToFullFilePath(item.img) : null,
      stock: Number(item.stock || 0),
      unitsSold: Number(item.unitsSold || 0),
      revenue: Number(item.revenue || 0),
    })),
    recentCustomers: recentCustomerRows.map((item) => ({
      ...item,
      salesOrders: Number(item.salesOrders || 0),
      totalSpend: Number(item.totalSpend || 0),
    })),
    categoryPerformance: categoryRows.map((item) => ({
      ...item,
      unitsSold: Number(item.unitsSold || 0),
      revenue: Number(item.revenue || 0),
    })),
  };
};

export default {
  getAdminDashboard,
};
