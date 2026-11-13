"use client";

import React, { useCallback, useEffect, useState } from "react";
import SingleOrder from "./SingleOrder";
import Link from "next/link";
import { getOrdersForUser } from "@/http/apiCalls";
import { Pagination } from "antd";

const STATUS_FILTERS = [
  { key: "", label: "All Orders" },
  { key: "ON_THE_WAY", label: "On the way" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

const Orders = () => {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Map filter key to backend status parameter if applicable
      let queryStatus = "";
      if (activeFilter === "DELIVERED") queryStatus = "DELIVERED";
      else if (activeFilter === "CANCELLED") queryStatus = "CANCELLED";
      else if (activeFilter === "ON_THE_WAY") queryStatus = "SHIPPED";

      const data = await getOrdersForUser({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search,
        status: queryStatus,
      });

      setOrderItems(data?.data || []);
      setTotalCount(data?.totalCount || 0);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination, search, activeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-16 pt-4 font-sans text-[#212121]">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-6">
        {/* Flipkart Style Breadcrumb */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-[#878787]">
          <Link href="/" className="hover:text-[#2874f0]">
            Home
          </Link>
          <span>›</span>
          <Link href="/my-account" className="hover:text-[#2874f0]">
            My Account
          </Link>
          <span>›</span>
          <span className="font-medium text-[#212121]">My Orders</span>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Filter Sidebar (Flipkart Style) */}
          <div className="lg:col-span-3">
            <div className="sticky top-20 rounded-sm border border-[#e0e0e0] bg-white p-4 shadow-2xs">
              <h2 className="border-b border-[#f0f0f0] pb-3 text-base font-semibold text-[#212121]">
                Filters
              </h2>

              {/* Order Status Section */}
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#878787]">
                  Order Status
                </p>
                <div className="mt-3 space-y-2.5">
                  {STATUS_FILTERS.map((f) => {
                    const isSelected = activeFilter === f.key;
                    return (
                      <label
                        key={f.key}
                        onClick={() => {
                          setActiveFilter(f.key);
                          setPagination((prev) => ({ ...prev, pageNumber: 1 }));
                        }}
                        className="flex cursor-pointer items-center gap-2.5 text-sm text-[#212121] transition hover:text-[#2874f0]"
                      >
                        <input
                          type="radio"
                          name="order_status_filter"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 accent-[#2874f0] cursor-pointer"
                        />
                        <span className={isSelected ? "font-semibold text-[#2874f0]" : ""}>
                          {f.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quick Summary Pill */}
              <div className="mt-6 border-t border-[#f0f0f0] pt-4 text-xs text-[#878787]">
                <p>
                  Total Orders: <strong className="text-[#212121]">{totalCount}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Right Orders List Area */}
          <div className="lg:col-span-9">
            {/* Search Orders Bar (Flipkart Style) */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="flex w-full overflow-hidden rounded-sm border border-[#e0e0e0] bg-white shadow-2xs transition-shadow focus-within:shadow-xs">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your orders here (by item name or order number)"
                    className="h-11 w-full bg-transparent px-4 pl-10 text-sm text-[#212121] placeholder-[#878787] outline-none"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#878787"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute left-3.5 top-3.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setPagination((prev) => ({ ...prev, pageNumber: 1 }));
                      }}
                      className="absolute right-3 top-3 text-xs text-[#878787] hover:text-[#212121]"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[#2874f0] px-6 text-sm font-semibold text-white transition hover:bg-[#1a5bc7] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span>Search Orders</span>
                </button>
              </div>
            </form>

            {/* Loading Indicator */}
            {loading && (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-sm border border-[#e0e0e0] bg-white py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2874f0] border-t-transparent" />
                <p className="mt-3 text-xs text-[#878787]">Loading your orders...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && orderItems.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-sm border border-[#e0e0e0] bg-white px-6 py-20 text-center shadow-2xs">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
                  📦
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#212121]">
                  No orders found
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[#878787]">
                  {search
                    ? `No orders matching "${search}". Try searching for something else.`
                    : "You haven't placed any orders in this category yet."}
                </p>
                <Link
                  href="/shop"
                  className="mt-6 rounded-sm bg-[#2874f0] px-6 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#1a5bc7]"
                >
                  Start Shopping
                </Link>
              </div>
            )}

            {/* Orders List */}
            {!loading && orderItems.length > 0 && (
              <div>
                {orderItems.map((orderItem) => (
                  <SingleOrder key={orderItem.orderNo || orderItem.id} orderItem={orderItem} />
                ))}

                {/* Pagination */}
                <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-sm border border-[#e0e0e0] bg-white p-4 sm:flex-row">
                  <p className="text-xs text-[#878787]">
                    Showing{" "}
                    <strong>
                      {(pagination.pageNumber - 1) * pagination.pageSize + 1} –{" "}
                      {Math.min(pagination.pageNumber * pagination.pageSize, totalCount)}
                    </strong>{" "}
                    of <strong>{totalCount}</strong> orders
                  </p>

                  <Pagination
                    current={pagination.pageNumber}
                    pageSize={pagination.pageSize}
                    total={totalCount}
                    onChange={(page, pageSize) => {
                      setPagination({ pageNumber: page, pageSize });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
