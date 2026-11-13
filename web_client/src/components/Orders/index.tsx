"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminMobileList from "../Common/AdminMobileList";
import Link from "next/link";
import { getOrdersForUser } from "@/http/apiCalls";
import { Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ORDER_STATUS_COLOR } from "@/utils/constants";
import { ORDER_URL } from "@/utils/appUrls";
import { ExportOutlined } from "@ant-design/icons";
import { getCurrencyDetails, getShippingDisplay } from "@/utils/helper";

const Orders = () => {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrdersForUser({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search,
        status,
      });
      setOrderItems(data?.data || []);
      setTotalCount(data?.totalCount || 0);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination, search, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const currency = getCurrencyDetails().currencySymbol;

  const columns: ColumnsType<any> = [
    {
      title: "S.No",
      key: "serialNo",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span className="font-medium text-dark">
          {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: "Image",
      dataIndex: "filePath",
      key: "filePath",
      align: "center",
      width: 85,
      render: (filePath) => (
        <img
          alt=""
          className="mx-auto h-14 w-14 rounded-xl border border-gray-3 object-cover shadow-2xs"
          src={filePath || "/images/products/product-01.png"}
        />
      ),
    },
    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      align: "center",
      render: (orderNo) => (
        <Link
          href={`${ORDER_URL}/${orderNo}`}
          className="font-medium text-dark hover:text-blue transition underline-offset-2 hover:underline"
          title="Go to specific order page"
        >
          #{orderNo}
        </Link>
      ),
    },
    {
      title: "Products",
      dataIndex: "title",
      key: "title",
      render: (products) => (
        <div className="max-w-[280px] truncate text-dark-4" title={products}>
          {products || "Store Merchandise"}
        </div>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "center",
      render: (text) => (
        <div className="text-center font-medium text-dark">
          {currency}{Number(text || 0).toFixed(2)}
        </div>
      ),
    },
    {
      title: "Shipping Amount",
      dataIndex: "shippingAmount",
      key: "shippingAmount",
      align: "center",
      render: (text) => (
        <div className="text-center text-dark-4">
          {getShippingDisplay(text)}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (text) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize"
          style={ORDER_STATUS_COLOR[text] || { backgroundColor: "#f1f5f9", color: "#475569" }}
        >
          {text ? String(text).replaceAll("_", " ") : "-"}
        </span>
      ),
    },
    {
      title: "Dispute",
      dataIndex: "dispute",
      key: "dispute",
      align: "center",
      render: (dispute) => {
        if (!dispute) {
          return <span className="text-sm text-dark-4">-</span>;
        }
        return (
          <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
            {dispute.status}
          </span>
        );
      },
    },
    {
      title: "View",
      dataIndex: "orderNo",
      key: "action",
      align: "center",
      width: 75,
      render: (orderNo) => (
        <Link
          href={`${ORDER_URL}/${orderNo}`}
          title="Go to specific order page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-3 text-dark hover:border-blue hover:text-blue transition cursor-pointer"
        >
          <ExportOutlined size={18} />
        </Link>
      ),
    },
  ];

  return (
    <section className="page-section">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="admin-page-card">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-dark">Order List</h2>
              <p className="text-sm text-dark-4">Track and review all your purchases.</p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="w-full max-w-[320px]">
              <Input
                placeholder="Search orders by # or item"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageNumber: 1 }));
                }}
              />
            </div>
          </div>

          {/* Mobile Card List */}
          <AdminMobileList
            items={orderItems}
            emptyText="No orders found."
            pagination={{
              current: pagination.pageNumber,
              pageSize: pagination.pageSize,
              total: totalCount,
              pageSizeOptions: ["10", "20"],
              onChange(page, pageSize) {
                setPagination({ pageNumber: page, pageSize });
              },
            }}
            renderCard={(item, index) => (
              <div className="admin-mobile-card" key={item.orderNo || item.id}>
                <div className="mb-4 flex items-center gap-3">
                  <img
                    alt=""
                    className="h-14 w-14 rounded-xl border border-gray-3 object-cover shadow-2xs"
                    src={item.filePath || "/images/products/product-01.png"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dark-5">
                      Order #{(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
                    </p>
                    <h3 className="text-base font-semibold text-dark">
                      <Link
                        href={`${ORDER_URL}/${item.orderNo}`}
                        className="hover:text-blue transition"
                      >
                        #{item.orderNo}
                      </Link>
                    </h3>
                    <p className="truncate text-sm text-dark-4">
                      {item.title || "Store Merchandise"}
                    </p>
                  </div>
                  <Link
                    href={`${ORDER_URL}/${item.orderNo}`}
                    title="Go to specific order page"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-3 text-dark transition hover:border-blue hover:text-blue shrink-0"
                  >
                    <ExportOutlined />
                  </Link>
                </div>

                <div className="admin-mobile-meta">
                  <span className="admin-mobile-label">Products</span>
                  <span className="admin-mobile-value max-w-[60%] truncate" title={item.title}>
                    {item.title || "-"}
                  </span>
                </div>

                <div className="admin-mobile-meta">
                  <span className="admin-mobile-label">Total</span>
                  <span className="admin-mobile-value font-medium">
                    {currency}{Number(item.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="admin-mobile-meta">
                  <span className="admin-mobile-label">Shipping</span>
                  <span className="admin-mobile-value">
                    {getShippingDisplay(item.shippingAmount)}
                  </span>
                </div>

                <div className="admin-mobile-meta">
                  <span className="admin-mobile-label">Status</span>
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={ORDER_STATUS_COLOR[item.status]}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="admin-mobile-meta">
                  <span className="admin-mobile-label">Dispute</span>
                  {item.dispute ? (
                    <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                      {item.dispute.status}
                    </span>
                  ) : (
                    <span className="admin-mobile-value">-</span>
                  )}
                </div>
              </div>
            )}
          />

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              className="admin-data-table"
              dataSource={orderItems}
              columns={columns}
              rowKey={(record) => record.orderNo || record.id}
              loading={loading}
              size="middle"
              scroll={{ x: 980 }}
              pagination={{
                current: pagination.pageNumber,
                pageSize: pagination.pageSize,
                total: totalCount,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20"],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                onChange(page, pageSize) {
                  setPagination({ pageNumber: page, pageSize });
                },
              }}
              locale={{ emptyText: "No orders found." }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Orders;
