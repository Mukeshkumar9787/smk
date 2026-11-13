"use client";

import React from "react";
import { dateFormatter, getCurrencyDetails } from "@/utils/helper";
import Link from "next/link";
import { ORDER_URL } from "@/utils/appUrls";

interface SingleOrderProps {
  orderItem: any;
}

const SingleOrder: React.FC<SingleOrderProps> = ({ orderItem }) => {
  const currency = getCurrencyDetails().currencySymbol;
  const imagePath = orderItem.filePath || "/images/products/product-01.png";
  const orderUrl = `${ORDER_URL}/${orderItem.orderNo}`;
  const itemCount = orderItem.orderProducts?.length || 1;
  const courier = orderItem.additionalInfo?.courier;
  const trackingId = orderItem.additionalInfo?.trackingId;

  const isDelivered = orderItem.status === "DELIVERED";
  const isCancelled = orderItem.status === "CANCELLED" || orderItem.status === "REJECTED";
  const isShipped = orderItem.status === "SHIPPED";

  // Flipkart Status Helper
  const getStatusDisplay = () => {
    if (isDelivered) {
      return {
        dotClass: "bg-[#26a541]",
        title: `Delivered on ${dateFormatter(orderItem.updatedAt || orderItem.createdAt)}`,
        subtitle: "Your item has been delivered",
        colorClass: "text-[#26a541]",
      };
    }
    if (isCancelled) {
      return {
        dotClass: "bg-[#ff6161]",
        title: `Cancelled on ${dateFormatter(orderItem.updatedAt || orderItem.createdAt)}`,
        subtitle: "Order has been cancelled",
        colorClass: "text-[#ff6161]",
      };
    }
    if (isShipped) {
      return {
        dotClass: "bg-[#2874f0]",
        title: "On the way (Shipped)",
        subtitle: courier && trackingId ? `${courier}: ${trackingId}` : "Item is in transit",
        colorClass: "text-[#2874f0]",
      };
    }
    return {
      dotClass: "bg-[#ff9f00]",
      title: "Order Confirmed",
      subtitle: `Placed on ${dateFormatter(orderItem.createdAt)}`,
      colorClass: "text-[#ff9f00]",
    };
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="group relative mb-3.5 rounded-sm border border-[#e0e0e0] bg-white p-4 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] sm:p-5">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:items-center">
        {/* 1. Item Details (Image, Title, Order #) */}
        <div className="flex items-start gap-4 md:col-span-5">
          <Link
            href={orderUrl}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border border-gray-100 bg-white p-1 hover:opacity-90"
          >
            <img
              src={imagePath}
              alt={orderItem.title || "Ordered Product"}
              className="h-full w-full object-contain"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={orderUrl}
              className="block truncate text-sm font-medium text-[#212121] transition hover:text-[#2874f0]"
              title={orderItem.title}
            >
              {orderItem.title || "Store Merchandise"}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#878787]">
              <span>Order #{orderItem.orderNo}</span>
              {itemCount > 1 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-[#2874f0]">+{itemCount - 1} more items</span>
                </>
              )}
            </div>

            <p className="mt-1 text-xs text-[#878787]">
              Ordered on: <strong className="text-gray-700">{dateFormatter(orderItem.createdAt)}</strong>
            </p>
          </div>
        </div>

        {/* 2. Total Price */}
        <div className="md:col-span-2 md:text-center">
          <p className="text-base font-semibold text-[#212121]">
            {currency}{Number(orderItem.totalAmount || 0).toFixed(2)}
          </p>
          <span className="mt-1 inline-block rounded-xs bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {orderItem.paymentType || "Online"}
          </span>
        </div>

        {/* 3. Delivery / Status Column (Flipkart Signature) */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2.5">
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${statusInfo.dotClass}`} />
            <span className="text-sm font-semibold text-[#212121]">
              {statusInfo.title}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#878787] pl-5">
            {statusInfo.subtitle}
          </p>
          {courier && trackingId && (
            <p className="mt-0.5 text-[11px] font-medium text-[#2874f0] pl-5">
              Tracking ID: {trackingId}
            </p>
          )}
        </div>

        {/* 4. Actions & Reviews Column */}
        <div className="flex flex-col items-start gap-2 pt-2 md:col-span-2 md:items-end md:pt-0">
          <Link
            href={orderUrl}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#2874f0] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#1a5bc7]"
          >
            <span>View Details</span>
            <span>›</span>
          </Link>

          <Link
            href={orderUrl}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2874f0] hover:underline"
          >
            <span className="text-amber-500">★</span>
            <span>Rate & Review Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
