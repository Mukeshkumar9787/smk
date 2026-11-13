"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  dateFormatter,
  getCurrencyDetails,
  getLoggedInUserData,
  getShippingDisplay,
  isPrintEnable,
} from "@/utils/helper";
import {
  getConfig,
  getOrderDetailsBySlug,
  getOrderDetailsBySlugAdmin,
  raiseOrderDispute,
  updateOrderBySlugAdmin,
  updateOrderStatusBySlugAdmin,
} from "@/http/apiCalls";
import {
  CONFIG_KEYS,
  getNextOrderStatuses,
  ORDER_STATUS,
  ORDER_STATUS_COLOR,
  ROLE_TYPES,
} from "@/utils/constants";
import Link from "next/link";
import { ORDER_URL, SHOP_DETAILS } from "@/utils/appUrls";
import { Input, Select } from "antd";
import ModalInfo from "../Common/ModalInfo";
import OrderStatusTimeline from "./OrderStatusHistory";
import OrderInvoice from "./Invoice";
const OrderInvoiceComponent: any = OrderInvoice;
import { useReactToPrint } from "react-to-print";
import CourierDetails from "./CourierDetails";
import { notifyError, notifySuccess } from "@/utils/notify";

const formatStatusLabel = (value: string) => value?.replaceAll("_", " ");

const FLIPKART_STAGES = [
  { key: "PLACED", label: "Order Confirmed", subtext: "Your order has been placed" },
  { key: "SHIPPED", label: "Shipped", subtext: "Item handed over to courier partner" },
  { key: "OUT_FOR_DELIVERY", label: "Out For Delivery", subtext: "Item is out for delivery in your area" },
  { key: "DELIVERED", label: "Delivered", subtext: "Package delivered to recipient" },
];

const getStageIndex = (status: string) => {
  switch (status) {
    case "PLACED":
      return 0;
    case "CONFIRMED":
    case "PROCESSING":
      return 0;
    case "SHIPPED":
      return 1;
    case "DELIVERED":
      return 3;
    default:
      return 0;
  }
};

const OrderDetails = ({ params, orderNo, orderItem }: any) => {
  const targetParams = params || { slug: orderNo || orderItem?.orderNo || orderItem?.slug };
  const [data, setData] = useState<any>(null);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const componentRef = useRef<any>(null);
  const [compInfo, setCompInfo] = React.useState<any>({});
  const [couriers, setCouriers] = useState<any[]>([]);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [isEditingDispute, setIsEditingDispute] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const handlePrint = useReactToPrint({ contentRef: componentRef });

  const fetchOrder = useCallback(async () => {
    if (!targetParams?.slug) return;
    try {
      const userData = await getLoggedInUserData();
      let response: any = null;

      if (userData?.role === ROLE_TYPES.ADMIN) {
        response = await getOrderDetailsBySlugAdmin(targetParams);
        const modifiedData = {
          ...response?.data,
          isAdmin: true,
        };
        setStatusInfo({ status: modifiedData?.status });
        setData(modifiedData);
      } else {
        response = await getOrderDetailsBySlug(targetParams);
        setData(response?.data);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  }, [targetParams]);

  const handleUpdateStatus = async () => {
    try {
      const response = await updateOrderStatusBySlugAdmin({
        slug: targetParams.slug,
        ...statusInfo,
      });
      if (response.success) {
        notifySuccess("Order status updated successfully.");
        fetchOrder();
      }
    } catch (error) {}
  };

  const handleUpdateOrder = async (e: any) => {
    try {
      e.preventDefault();
      if (!data?.additionalInfo?.courier) {
        notifyError("Please select courier.");
        return;
      }
      if (!data?.additionalInfo?.trackingId) {
        notifyError("Please enter tracking ID.");
        return;
      }
      const response = await updateOrderBySlugAdmin({
        slug: targetParams.slug,
        additionalInfo: data?.additionalInfo || {},
      });
      if (response.success) {
        notifySuccess("Courier details updated successfully.");
        fetchOrder();
      }
    } catch (error) {}
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setData((prev: any) => {
      const additionalInfo = prev.additionalInfo || {};
      additionalInfo[name] = value;
      return { ...prev, additionalInfo };
    });
  };

  const handleRaiseDispute = async () => {
    const trimmedMessage = disputeMessage.trim();
    if (trimmedMessage.length < 5) {
      notifyError("Please enter at least 5 characters.");
      return;
    }

    try {
      setIsSubmittingDispute(true);
      const response = await raiseOrderDispute({
        slug: targetParams.slug,
        message: trimmedMessage,
      });
      if (response.success) {
        notifySuccess(
          response.message ||
            (isEditingDispute ? "Dispute updated successfully." : "Dispute submitted successfully.")
        );
        setIsDisputeModalOpen(false);
        setDisputeMessage("");
        setIsEditingDispute(false);
        fetchOrder();
      }
    } catch (error: any) {
      notifyError(
        error?.response?.data?.message ||
          (isEditingDispute ? "Unable to update dispute." : "Unable to submit dispute.")
      );
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const openCreateDisputeModal = () => {
    setIsEditingDispute(false);
    setDisputeMessage("");
    setIsDisputeModalOpen(true);
  };

  const openEditDisputeModal = () => {
    setIsEditingDispute(true);
    setDisputeMessage(dispute?.message || "");
    setIsDisputeModalOpen(true);
  };

  const copyTrackingNumber = () => {
    if (data?.additionalInfo?.trackingId) {
      navigator.clipboard?.writeText(data.additionalInfo.trackingId);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const fetchConfig = useCallback(async () => {
    try {
      const { success, data } = await getConfig({
        configs: [CONFIG_KEYS.COMP_INFO, CONFIG_KEYS.COURIER],
      });
      if (!success) return;
      setCompInfo(data?.[CONFIG_KEYS.COMP_INFO] ?? {});
      setCouriers(data?.[CONFIG_KEYS.COURIER] || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center bg-[#f1f3f6] py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2874f0] border-t-transparent" />
        <p className="mt-3 text-xs text-[#878787]">Loading order details...</p>
      </div>
    );
  }

  const productItems = data?.products || [];
  const totalAmount = data?.totalAmount || 0;
  const currency = getCurrencyDetails().currencySymbol;
  const nextSteps = getNextOrderStatuses(data?.status);
  const orderStatusHistory = data?.orderStatusHistory || [];
  const dispute = data?.dispute;
  const courier = data?.additionalInfo?.courier;
  const trackingId = data?.additionalInfo?.trackingId;
  const courierObj = couriers.find((c) => c.name === courier);
  const courierLink = courierObj?.link || "#";

  const isDelivered = data?.status === "DELIVERED";
  const isCancelled = data?.status === "CANCELLED" || data?.status === "REJECTED";
  const currentStageIdx = getStageIndex(data?.status);

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-16 pt-4 font-sans text-[#212121]">
      {/* Hidden Invoice print target */}
      <div ref={componentRef} className="hidden print:block print-only">
        <OrderInvoiceComponent data={{ ...data, compInfo }} />
      </div>

      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-6">
        {/* Flipkart Breadcrumbs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#878787]">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#2874f0]">
              Home
            </Link>
            <span>›</span>
            <Link href="/my-account" className="hover:text-[#2874f0]">
              My Account
            </Link>
            <span>›</span>
            <Link href={ORDER_URL} className="hover:text-[#2874f0]">
              My Orders
            </Link>
            <span>›</span>
            <span className="font-medium text-[#212121]">#{data?.orderNo}</span>
          </div>

          <Link
            href={ORDER_URL}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2874f0] hover:underline"
          >
            <span>‹ Back to My Orders</span>
          </Link>
        </div>

        {/* 1. Flipkart Delivery Address & Actions Header Card */}
        <div className="mb-3.5 rounded-sm border border-[#e0e0e0] bg-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            {/* Delivery Address */}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#878787]">
                Delivery Address
              </h2>
              <div className="mt-2 text-sm text-[#212121]">
                <p className="font-bold text-base text-[#212121]">
                  {data?.user?.name || data?.name || "Customer"}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-[#212121] leading-relaxed">
                  {data?.address || "Address details on file"}
                </p>
                {data?.user?.mobile && (
                  <p className="mt-2 text-xs text-[#212121]">
                    <span className="font-semibold">Phone number: </span>
                    {data.user.mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Order Actions */}
            <div className="flex flex-wrap items-center gap-2.5 border-t border-[#f0f0f0] pt-3 md:border-t-0 md:pt-0">
              {isPrintEnable(data?.status) && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#2874f0] bg-white px-4 py-2 text-xs font-semibold text-[#2874f0] transition hover:bg-blue-50 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect width="12" height="8" x="6" y="14"></rect>
                  </svg>
                  <span>Download Invoice</span>
                </button>
              )}

              <button
                type="button"
                onClick={dispute ? openEditDisputeModal : openCreateDisputeModal}
                className="inline-flex items-center gap-1.5 rounded-sm border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
              >
                <span>❓ Need Help?</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Order Item & Flipkart Stepper Card */}
        <div className="mb-3.5 rounded-sm border border-[#e0e0e0] bg-white p-5 shadow-2xs sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Products List (Left: 5 cols) */}
            <div className="lg:col-span-5 border-b border-[#f0f0f0] pb-6 lg:border-b-0 lg:border-r lg:pr-6">
              <div className="space-y-4">
                {productItems.map((product: any) => (
                  <div key={product.id || product.slug} className="flex items-start gap-4">
                    <Link
                      href={`${SHOP_DETAILS}/${product.slug}`}
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border border-gray-100 bg-white p-1"
                    >
                      <img
                        src={product.img || "/images/products/product-01.png"}
                        alt={product.title}
                        className="h-full w-full object-contain"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`${SHOP_DETAILS}/${product.slug}`}
                        className="block font-medium text-sm text-[#212121] transition hover:text-[#2874f0] line-clamp-2"
                      >
                        {product.title}
                      </Link>

                      <div className="mt-1 flex items-center gap-2 text-xs text-[#878787]">
                        <span>Seller: SMK Retail</span>
                        <span className="inline-flex items-center rounded-xs bg-blue-50 px-1 text-[10px] font-bold text-[#2874f0]">
                          ✓ Verified
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-sm font-bold text-[#212121]">
                          {currency}{Number(product.price * (product.quantity || 1)).toFixed(2)}
                        </span>
                        <span className="text-xs text-[#878787]">
                          ({currency}{Number(product.price).toFixed(2)} x {product.quantity || 1})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Courier info highlight if in transit */}
              {courier && trackingId && (
                <div className="mt-5 rounded-xs border border-blue-100 bg-blue-50/70 p-3 text-xs text-[#2874f0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Courier: <span className="text-[#2874f0]">{courier}</span>
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-gray-700">
                        AWB: <strong>{trackingId}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyTrackingNumber}
                        className="rounded-xs border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#2874f0] hover:bg-blue-100 cursor-pointer"
                      >
                        {copiedTracking ? "✓ Copied" : "Copy AWB"}
                      </button>

                      {courierLink !== "#" && (
                        <a
                          href={courierLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xs bg-[#2874f0] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1a5bc7]"
                        >
                          Track ›
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flipkart Stepper Timeline (Right: 7 cols) */}
            <div className="lg:col-span-7 lg:pl-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#878787]">
                Order Progress & Delivery Status
              </h3>

              {!isCancelled ? (
                <div className="relative pl-3">
                  <div className="space-y-6">
                    {FLIPKART_STAGES.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div key={stage.key} className="relative flex items-start gap-4">
                          {/* Connector vertical line */}
                          {idx < FLIPKART_STAGES.length - 1 && (
                            <div
                              className={`absolute left-[9px] top-5 h-full w-[2px] ${
                                idx < currentStageIdx ? "bg-[#26a541]" : "bg-gray-200"
                              }`}
                            />
                          )}

                          {/* Stepper Dot */}
                          <div
                            className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs ${
                              isCompleted
                                ? "bg-[#26a541] ring-3 ring-green-100"
                                : "border border-gray-300 bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isCompleted ? "✓" : ""}
                          </div>

                          {/* Stage Text */}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-semibold ${
                                isCurrent
                                  ? "text-[#2874f0]"
                                  : isCompleted
                                  ? "text-[#212121]"
                                  : "text-gray-400"
                              }`}
                            >
                              {stage.label}
                            </p>
                            <p className="text-xs text-[#878787]">
                              {isCompleted && idx === 0 && data?.createdAt
                                ? `Confirmed on ${dateFormatter(data.createdAt)}`
                                : isCompleted && isDelivered && idx === 3
                                ? `Delivered on ${dateFormatter(data.updatedAt || data.createdAt)}`
                                : stage.subtext}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xs border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6161]" />
                    <span className="font-bold text-sm text-[#ff6161]">Order Cancelled</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-700">
                    This order was {formatStatusLabel(data?.status)}. If payment was already debited, the refund will be credited back to the original payment source within 3–5 working days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Bottom Grid: Price Details + Dispute Card */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
          {/* Price Details (Flipkart Signature Card) */}
          <div className="md:col-span-6 lg:col-span-5">
            <div className="rounded-sm border border-[#e0e0e0] bg-white p-5 shadow-2xs">
              <h3 className="border-b border-[#f0f0f0] pb-3 text-sm font-bold uppercase tracking-wider text-[#878787]">
                Price Details
              </h3>

              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>List Price ({productItems.length} items)</span>
                  <span>{currency}{Number(totalAmount).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="font-medium text-[#26a541]">
                    {getShippingDisplay(data?.shippingAmount) === "Free" || Number(data?.shippingAmount || 0) === 0
                      ? "FREE"
                      : `${currency}${Number(data?.shippingAmount || 0).toFixed(2)}`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-[#e0e0e0] pt-3 text-base font-bold text-[#212121]">
                  <span>Total Amount</span>
                  <span>{currency}{Number(totalAmount).toFixed(2)}</span>
                </div>

                <div className="border-t border-[#f0f0f0] pt-2 text-xs text-[#878787]">
                  <span>Payment Mode: </span>
                  <strong className="text-gray-800">{data?.paymentType || "Online Payment"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute & Support Details */}
          <div className="md:col-span-6 lg:col-span-7">
            <div className="rounded-sm border border-[#e0e0e0] bg-white p-5 shadow-2xs h-full flex flex-col justify-between">
              <div>
                <h3 className="border-b border-[#f0f0f0] pb-3 text-sm font-bold uppercase tracking-wider text-[#878787]">
                  Customer Support & Help
                </h3>

                {dispute ? (
                  <div className="mt-3 rounded-xs border border-red-200 bg-red-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                        Dispute {dispute.status}
                      </span>
                      {!data?.isAdmin && dispute.status === "OPEN" && (
                        <button
                          type="button"
                          onClick={openEditDisputeModal}
                          className="text-xs font-semibold text-[#2874f0] hover:underline cursor-pointer"
                        >
                          Edit Dispute
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                      {dispute.message}
                    </p>
                    <p className="mt-2 text-[11px] text-[#878787]">
                      Raised on {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "-"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-[#878787] leading-relaxed">
                    <p>
                      Have an issue with this order? Whether it is related to damaged products, delayed delivery, or return queries, you can report an issue to our support team anytime.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateDisputeModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#2874f0] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a5bc7] cursor-pointer"
                    >
                      Report an Issue / Raise Dispute
                    </button>
                  </div>
                )}
              </div>

              {/* Order Notes if present */}
              {data?.notes && (
                <div className="mt-4 border-t border-[#f0f0f0] pt-3 text-xs text-[#878787]">
                  <span>Order Note: </span>
                  <span className="text-gray-700">{data.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Administrative Controls (Visible only to Admin accounts) */}
        {data?.isAdmin && (
          <div className="mt-4 rounded-sm border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
            <h3 className="border-b border-amber-200 pb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              Admin Order Management Panel
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Status Update */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-700">Change Status:</p>
                <Select
                  value={statusInfo?.status}
                  onChange={(value) => setStatusInfo({ status: value, isConfirm: true })}
                  style={{ width: "100%" }}
                >
                  {nextSteps.map((item: string) => (
                    <Select.Option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </Select.Option>
                  ))}
                </Select>

                <ModalInfo
                  content={
                    <div>
                      <p>
                        Proceed to set order status to{" "}
                        <strong>{formatStatusLabel(statusInfo?.status)}</strong>?
                      </p>
                      {[ORDER_STATUS.REJECTED].includes(statusInfo?.status) && (
                        <Input
                          className="mt-3"
                          type="text"
                          placeholder="Enter rejection comments"
                          value={statusInfo?.meta?.comments || ""}
                          onChange={(e) =>
                            setStatusInfo((prev: any) => ({
                              ...prev,
                              meta: { comments: e.target.value },
                            }))
                          }
                        />
                      )}
                    </div>
                  }
                  isOpen={statusInfo?.isConfirm}
                  onClose={() => setStatusInfo({ status: data?.status })}
                  onOk={handleUpdateStatus}
                />
              </div>

              {/* Courier Update */}
              <div>
                <CourierDetails
                  couriers={couriers}
                  handleChange={handleChange}
                  additionalInfo={data?.additionalInfo}
                  isAdmin={data?.isAdmin}
                  onSubmit={handleUpdateOrder}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <ModalInfo
        isOpen={isDisputeModalOpen}
        onClose={() => {
          if (isSubmittingDispute) return;
          setIsDisputeModalOpen(false);
          setIsEditingDispute(false);
          setDisputeMessage("");
        }}
        onOk={handleRaiseDispute}
        content={
          <div>
            <h3 className="text-base font-bold text-[#212121]">
              {isEditingDispute ? "Update Order Dispute" : "Report an Issue with Order"}
            </h3>
            <p className="mt-1 text-xs text-[#878787]">
              Our support team will review your message and reply via email within 24 hours.
            </p>
            <Input.TextArea
              className="mt-3 rounded-sm text-xs"
              rows={4}
              maxLength={1000}
              placeholder="Describe what went wrong (e.g., damaged product, missing item)..."
              value={disputeMessage}
              onChange={(e) => setDisputeMessage(e.target.value)}
            />
          </div>
        }
      />
    </div>
  );
};

export default OrderDetails;
