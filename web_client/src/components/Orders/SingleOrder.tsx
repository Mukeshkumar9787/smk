"use client";

import React, { useState } from "react";
import { dateFormatter, getCurrencyDetails } from "@/utils/helper";
import Link from "next/link";
import { ORDER_URL } from "@/utils/appUrls";
import { ORDER_STATUS_COLOR } from "@/utils/constants";

interface SingleOrderProps {
  orderItem: any;
  onViewDetails?: (orderNo: string) => void;
}

const STAGES = [
  { key: "PLACED", label: "Order Placed", icon: "📝" },
  { key: "PROCESSING", label: "Processing", icon: "⚙️" },
  { key: "SHIPPED", label: "Shipped", icon: "🚚" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉" },
];

const getStageIndex = (status: string) => {
  switch (status) {
    case "PLACED":
      return 0;
    case "CONFIRMED":
    case "PROCESSING":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return 0;
  }
};

const formatStatus = (status: string) => {
  if (!status) return "Pending";
  return status.replaceAll("_", " ");
};

const SingleOrder: React.FC<SingleOrderProps> = ({ orderItem, onViewDetails }) => {
  const [copied, setCopied] = useState(false);
  const imagePath = orderItem.filePath || "/images/products/product-01.png";
  const currency = getCurrencyDetails().currencySymbol;
  const itemCount = orderItem.orderProducts?.length || 1;
  const courier = orderItem.additionalInfo?.courier;
  const trackingId = orderItem.additionalInfo?.trackingId;
  const isDelivered = orderItem.status === "DELIVERED";
  const isCancelled = orderItem.status === "CANCELLED" || orderItem.status === "REJECTED";
  const currentStageIdx = getStageIndex(orderItem.status);
  const recipientName = orderItem.name || orderItem.user?.name || "Customer";
  const orderUrl = `${ORDER_URL}/${orderItem.orderNo}`;

  const copyOrderNo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (orderItem.orderNo) {
      navigator.clipboard?.writeText(orderItem.orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewDetails) {
      onViewDetails(orderItem.orderNo);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:border-sky-300 hover:shadow-lg">
      {/* Header Bar: Amazon-Style Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Order Placed
            </span>
            <span className="font-semibold text-slate-800">
              {dateFormatter(orderItem.createdAt)}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Total Amount
            </span>
            <span className="font-bold text-slate-900">
              {currency}{Number(orderItem.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Ship To
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px] block" title={recipientName}>
              {recipientName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Order Number pill linking directly to the specific order page */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-medium">Order</span>
            <Link
              href={orderUrl}
              title="Go to specific order page"
              className="font-mono text-xs font-bold text-slate-900 hover:text-sky-600 transition underline-offset-2 hover:underline"
            >
              #{orderItem.orderNo}
            </Link>
            <button
              type="button"
              onClick={copyOrderNo}
              title="Copy Order ID"
              className="text-slate-400 hover:text-sky-600 transition p-0.5"
            >
              {copied ? (
                <span className="text-[10px] font-bold text-emerald-600">✓</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              )}
            </button>
          </div>

          {/* Dispute Warning Badge if open */}
          {orderItem.dispute && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
              <span>⚠️ Dispute {orderItem.dispute.status}</span>
            </span>
          )}

          {/* Status Badge */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize shadow-2xs"
            style={ORDER_STATUS_COLOR[orderItem.status] || { backgroundColor: "#f1f5f9", color: "#475569" }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isDelivered
                  ? "bg-emerald-600"
                  : isCancelled
                  ? "bg-rose-600"
                  : "bg-sky-600 animate-pulse"
              }`}
            />
            {formatStatus(orderItem.status)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Visual Progress Stepper */}
        {!isCancelled ? (
          <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              {STAGES.map((stg, idx) => {
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={stg.key} className="flex flex-col items-center">
                    <div className="flex items-center w-full">
                      <div
                        className={`h-1 flex-1 rounded-full transition-all ${
                          idx === 0
                            ? "invisible"
                            : idx <= currentStageIdx
                            ? "bg-sky-500"
                            : "bg-slate-200"
                        }`}
                      />
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isCompleted
                            ? "bg-sky-600 text-white shadow-xs ring-4 ring-sky-100"
                            : "border border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div
                        className={`h-1 flex-1 rounded-full transition-all ${
                          idx === STAGES.length - 1
                            ? "invisible"
                            : idx < currentStageIdx
                            ? "bg-sky-500"
                            : "bg-slate-200"
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-2 text-[11px] truncate max-w-full font-medium ${
                        isCurrent
                          ? "text-sky-700 font-bold"
                          : isCompleted
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {stg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800">
            <span className="text-base">⚠️</span>
            <span>
              This order was <strong>{formatStatus(orderItem.status).toLowerCase()}</strong>. If you were charged, a refund is processed automatically.
            </span>
          </div>
        )}

        {/* Product Details & Direct Links */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Clickable Image -> Specific Order Page */}
            <Link
              href={orderUrl}
              title="Click to view specific order details"
              className="group/img relative h-22 w-22 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner flex items-center justify-center"
            >
              <img
                src={imagePath}
                alt={orderItem.title || "Ordered item"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
              {itemCount > 1 && (
                <span className="absolute bottom-1 right-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  +{itemCount - 1} more
                </span>
              )}
            </Link>

            {/* Clickable Title & Specs */}
            <div className="min-w-0 flex-1">
              <Link
                href={orderUrl}
                title="View full order details"
                className="block truncate text-sm sm:text-base font-bold text-slate-900 hover:text-sky-600 transition"
              >
                {orderItem.title || (orderItem.orderProducts?.[0]?.product?.title) || "Store Merchandise"}
              </Link>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span>•</span>
                <span>
                  Total: <strong className="font-bold text-slate-900">{currency}{Number(orderItem.totalAmount || 0).toFixed(2)}</strong>
                </span>
                <span>•</span>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {orderItem.paymentType || "Online Payment"}
                </span>
              </div>

              {/* Courier Tracking Pill if available */}
              {courier && trackingId && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-800 border border-sky-100">
                  <span>🚚</span>
                  <span>
                    {courier}: <strong className="font-mono font-bold text-sky-950">{trackingId}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Explicit Prominent Link to Specific Order Page */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 shrink-0">
            {/* Primary Action: Go to Specific Order Page */}
            <Link
              href={orderUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md cursor-pointer"
            >
              <span>View Order Details</span>
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
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>

            {/* Secondary Action: Quick View Modal */}
            <button
              type="button"
              onClick={handleOpenQuickView}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-sky-600 cursor-pointer"
              title="Quick Preview Modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Quick View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
