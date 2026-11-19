"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "../Common/Breadcrumb";
import { getAdminDashboard } from "@/http/apiCalls";
import { getCurrencyDetails, getLoggedInUserData, getShippingDisplay, getStoredToken, redirectToSignIn } from "@/utils/helper";
import { ORDER_STATUS, ORDER_STATUS_COLOR, ROLE_TYPES, STATUS_TYPES } from "@/utils/constants";
import { ORDER_URL, PRODUCT_URL, USER_URL } from "@/utils/appUrls";
import { useTenant } from "@/app/context/TenantContext";
import { withTenantPath } from "@/lib/tenantUrl";

const SALES_STATUSES = new Set([
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
]);

const ORDER_STATUS_SEQUENCE = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.REJECTED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.PAYMENT_FAILED,
];

const getLastSixMonths = () => {
  const months = [];
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      amount: 0,
    });
  }

  return months;
};

const formatAmount = (value = 0) => {
  const amount = Number(value || 0);
  return `${getCurrencyDetails().currencySymbol}${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
};

const HERO_BACKGROUND = {
  background:
    "radial-gradient(circle at top left, rgba(56,189,248,0.22), transparent 28%), linear-gradient(135deg, #07111f 0%, #102541 55%, #173f6b 100%)",
};

const SUMMARY_ACCENTS = {
  Sales: "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #99f6e4 100%)",
  Products: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #bfdbfe 100%)",
  "Stock Units": "linear-gradient(135deg, #9f1239 0%, #f43f5e 55%, #fecdd3 100%)",
  Customers: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 55%, #ddd6fe 100%)",
};

const Dashboard = () => {
  const { tenant, branding, storeHref } = useTenant();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState(null);

  React.useEffect(() => {
    const loadDashboard = async () => {
      if (!getStoredToken()) {
        redirectToSignIn("/dashboard");
        return;
      }

      try {
        const user = await getLoggedInUserData();

        if (!user) {
          redirectToSignIn("/dashboard");
          return;
        }

        if (user.role !== ROLE_TYPES.ADMIN) {
          window.location.href = withTenantPath("/");
          return;
        }

        const response = await getAdminDashboard();
        setDashboardData(response?.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const overview = React.useMemo(() => dashboardData?.overview || {}, [dashboardData]);
  const salesTrend = React.useMemo(() => dashboardData?.salesTrend || getLastSixMonths(), [dashboardData]);
  const statusStats = React.useMemo(() => dashboardData?.orderStatus || {}, [dashboardData]);
  const stockBuckets = React.useMemo(() => dashboardData?.stockBuckets || [], [dashboardData]);
  const recentOrders = React.useMemo(() => dashboardData?.recentOrders || [], [dashboardData]);
  const lowStockProducts = React.useMemo(() => dashboardData?.lowStockProducts || [], [dashboardData]);
  const topProducts = React.useMemo(() => dashboardData?.topProducts || [], [dashboardData]);
  const recentCustomers = React.useMemo(() => dashboardData?.recentCustomers || [], [dashboardData]);
  const categoryPerformance = React.useMemo(() => dashboardData?.categoryPerformance || [], [dashboardData]);

  const statusChartData = React.useMemo(
    () =>
      ORDER_STATUS_SEQUENCE.map((status) => ({
        label: status.replaceAll("_", " "),
        value: Number(statusStats?.[status] || 0),
      })),
    [statusStats]
  );

  const summaryCards = [
    {
      label: "Sales",
      value: formatAmount(overview.totalSales),
      detail: `${overview.salesOrderCount || 0} paid or fulfilled orders`,
    },
    {
      label: "Products",
      value: Number(overview.totalProducts || 0).toLocaleString("en-IN"),
      detail: `${overview.activeProducts || 0} active listings`,
    },
    {
      label: "Stock Units",
      value: Number(overview.stockUnits || 0).toLocaleString("en-IN"),
      detail: `${overview.outOfStockCount || 0} products out of stock`,
    },
    {
      label: "Customers",
      value: Number(overview.totalUsers || 0).toLocaleString("en-IN"),
      detail: `${formatAmount(overview.averageOrderValue)} average order value`,
    },
  ];

  const maxSalesValue = Math.max(...salesTrend.map((item) => Number(item.revenue || item.amount || 0)), 1);
  const maxStatusValue = Math.max(...statusChartData.map((item) => item.value), 1);
  const maxStockBucketValue = Math.max(...stockBuckets.map((item) => item.value), 1);
  const maxCategoryRevenue = Math.max(...categoryPerformance.map((item) => Number(item.revenue || 0)), 1);

  return (
    <>
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="mb-6 rounded-[28px] p-6 text-white shadow-[0_24px_80px_rgba(7,17,31,0.28)] sm:p-8" style={HERO_BACKGROUND}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[620px]">
                <Breadcrumb
                  adminOnly
                  title={"Dashboard"}
                  pages={["Dashboard"]}
                  variant="inline"
                  showTitle={false}
                  className="mb-4"
                  tone="light"
                />
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  Admin Overview
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Sales, catalog, and stock health in one screen.
                </h1>
                <p className="mt-3 text-sm text-slate-200 sm:text-base">
                  This dashboard summarizes revenue momentum, order movement, and inventory pressure so the admin can start from signals instead of tables.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Orders</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{Number(statusStats?.ALL || overview.totalOrders || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Low Stock</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{Number(overview.lowStockCount || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Restock Requests</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{Number(overview.restockRequestCount || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Store & Autonomous Feature Status */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl bg-blue/10 px-3 py-1.5 text-xs font-bold text-blue">
                🏪 Store: {tenant.name}
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                Products: {Number(overview.totalProducts || 0)}
              </span>
              <span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                branding.aiChatbotActive !== false
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {branding.aiChatbotActive !== false
                  ? "🤖 AI Chatbot: Active"
                  : "⏸️ AI Chatbot: Inactive"}
              </span>
            </div>
            <Link
              href={storeHref("/config/branding")}
              className="inline-flex items-center text-xs font-semibold text-blue hover:underline"
            >
              Configure Store Branding →
            </Link>
          </div>

          {isLoading ? (
            <div className="surface-card p-8 text-center text-dark-4">Loading dashboard...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <div
                    key={card.label}
                    className="overflow-hidden rounded-[24px] p-[1px] shadow-lg"
                    style={{ background: SUMMARY_ACCENTS[card.label] }}
                  >
                    <div className="h-full rounded-[23px] bg-white px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dark-4">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-dark">{card.value}</p>
                      <p className="mt-2 text-sm text-dark-4">{card.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-dark">Sales Trend</h2>
                      <p className="text-sm text-dark-4">Last 6 months based on placed, confirmed, shipped, and delivered orders.</p>
                    </div>
                    <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                      {formatAmount(overview.totalSales)}
                    </div>
                  </div>

                  <div className="grid h-[260px] grid-cols-6 items-end gap-3">
                    {salesTrend.map((item) => (
                      <div key={item.key} className="flex h-full flex-col justify-end">
                        <div className="mb-2 text-center text-xs font-medium text-dark-4">
                          {Number(item.revenue || item.amount || 0) ? formatAmount(Number(item.revenue || item.amount || 0)) : "0"}
                        </div>
                        <div className="relative flex-1 rounded-2xl bg-slate-100">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-2xl bg-[linear-gradient(180deg,#0f766e_0%,#14b8a6_100%)]"
                            style={{ height: `${Math.max(((Number(item.revenue || item.amount || 0)) / maxSalesValue) * 100, Number(item.revenue || item.amount || 0) ? 12 : 0)}%` }}
                          />
                        </div>
                        <div className="mt-3 text-center text-sm font-medium text-dark">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-dark">Order Status Mix</h2>
                    <p className="text-sm text-dark-4">Current distribution across the full order pipeline.</p>
                  </div>

                  <div className="space-y-4">
                    {statusChartData.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-dark">{item.label}</span>
                          <span className="text-dark-4">{item.value}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div
                            className="h-3 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#38bdf8_100%)]"
                            style={{ width: `${(item.value / maxStatusValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_1.25fr]">
                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-dark">Stock Health</h2>
                    <p className="text-sm text-dark-4">Inventory grouped by pressure level so replenishment risk is obvious.</p>
                  </div>

                  <div className="space-y-4">
                    {stockBuckets.map((bucket) => (
                      <div key={bucket.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-dark">{bucket.label}</span>
                          <span className="text-dark-4">{bucket.value}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${(bucket.value / maxStockBucketValue) * 100}%`,
                              backgroundColor: bucket.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-dark">Low Stock Watchlist</h2>
                      <p className="text-sm text-dark-4">Products most likely to need intervention soon.</p>
                    </div>
                    <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                      {overview.lowStockCount || 0} urgent
                    </div>
                  </div>

                  <div className="space-y-3">
                    {lowStockProducts.length ? (
                      lowStockProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-gray-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <Link
                              href={storeHref(`${PRODUCT_URL}/${product.slug}`)}
                              className="block truncate font-medium text-dark transition hover:text-blue"
                            >
                              {product.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-sm text-dark-4">
                                {product.categoryName || "Uncategorized"}
                              </p>
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                product.status === STATUS_TYPES.ACTIVE ? "bg-green text-white" : "bg-red text-white"
                              }`}>
                                {product.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                              {product.stock} left
                            </div>
                            <p className="mt-1 text-xs text-dark-4">
                              {product.restockRequests || 0} restock requests
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-3 px-5 py-8 text-center text-dark-4">
                        No low-stock products right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-dark">Top Products</h2>
                    <p className="text-sm text-dark-4">Best-selling products by sold units across completed pipeline stages.</p>
                  </div>
                  <div className="space-y-3">
                    {topProducts.length ? (
                      topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-gray-3 px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue/10 text-sm font-semibold text-blue">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={storeHref(`${PRODUCT_URL}/${product.slug}`)}
                              className="block truncate font-medium text-dark transition hover:text-blue"
                            >
                              {product.title}
                            </Link>
                            <p className="text-sm text-dark-4">
                              {product.categoryName || "Uncategorized"} • {product.unitsSold} units sold
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-dark">{formatAmount(product.revenue)}</p>
                            <p className="text-xs text-dark-4">{product.stock} in stock</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-3 px-5 py-8 text-center text-dark-4">
                        No product sales data available yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="surface-card p-5 sm:p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-dark">Category Performance</h2>
                    <p className="text-sm text-dark-4">Revenue distribution across your top categories.</p>
                  </div>
                  <div className="space-y-4">
                    {categoryPerformance.length ? (
                      categoryPerformance.map((category) => (
                        <div key={category.categoryName}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-dark">{category.categoryName || "Uncategorized"}</span>
                            <span className="text-dark-4">{formatAmount(category.revenue)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-100">
                            <div
                              className="h-3 rounded-full bg-[linear-gradient(90deg,#f97316_0%,#fb7185_100%)]"
                              style={{ width: `${(Number(category.revenue || 0) / maxCategoryRevenue) * 100}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-dark-4">{category.unitsSold} units sold</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-3 px-5 py-8 text-center text-dark-4">
                        No category sales data available yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="surface-card p-5 sm:p-7">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-dark">Recent Orders</h2>
                    <p className="text-sm text-dark-4">Latest customer orders directly on the admin landing screen.</p>
                  </div>
                  <Link
                    href={storeHref(ORDER_URL)}
                    className="inline-flex items-center rounded-full border border-gray-3 px-4 py-2 text-sm font-medium text-dark transition hover:border-blue hover:text-blue"
                  >
                    View all orders
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {recentOrders.length ? (
                    <table className="min-w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.2em] text-dark-4">
                          <th className="px-4 py-2 font-semibold">Order</th>
                          <th className="px-4 py-2 font-semibold">Customer</th>
                          <th className="px-4 py-2 font-semibold">Products</th>
                          <th className="px-4 py-2 font-semibold">Total</th>
                          <th className="px-4 py-2 font-semibold">Shipping</th>
                          <th className="px-4 py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="rounded-2xl bg-slate-50">
                            <td className="rounded-l-2xl px-4 py-4 align-top">
                              <Link
                                href={storeHref(`${ORDER_URL}/${order.orderNo}`)}
                                className="font-semibold text-dark transition hover:text-blue"
                              >
                                #{order.orderNo}
                              </Link>
                              <p className="mt-1 text-sm text-dark-4">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-dark">
                              {order.user?.name || "Guest"}
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-dark">
                              <div className="max-w-[280px] truncate">{order.title}</div>
                            </td>
                            <td className="px-4 py-4 align-top text-sm font-medium text-dark">
                              {formatAmount(order.totalAmount)}
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-dark">
                              {getShippingDisplay(order.shippingAmount)}
                            </td>
                            <td className="rounded-r-2xl px-4 py-4 align-top">
                              <span
                                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                                style={ORDER_STATUS_COLOR[order.status]}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-3 px-5 py-8 text-center text-dark-4">
                      No orders found yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="surface-card p-5 sm:p-7">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-dark">Recent Customers</h2>
                    <p className="text-sm text-dark-4">Newest accounts with their paid-order activity and spend.</p>
                  </div>
                  <Link
                    href={storeHref(USER_URL)}
                    className="inline-flex items-center rounded-full border border-gray-3 px-4 py-2 text-sm font-medium text-dark transition hover:border-blue hover:text-blue"
                  >
                    View all users
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recentCustomers.length ? (
                    recentCustomers.map((customer) => (
                      <div key={customer.id} className="rounded-2xl border border-gray-3 px-5 py-4">
                        <p className="font-semibold text-dark">{customer.name}</p>
                        <p className="mt-1 truncate text-sm text-dark-4">{customer.email}</p>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-dark-4">Joined</span>
                          <span className="font-medium text-dark">
                            {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-dark-4">Sales Orders</span>
                          <span className="font-medium text-dark">{customer.salesOrders}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-dark-4">Spend</span>
                          <span className="font-medium text-dark">{formatAmount(customer.totalSpend)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-3 px-5 py-8 text-center text-dark-4 md:col-span-2 xl:col-span-3">
                      No customers found yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
