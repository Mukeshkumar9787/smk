"use client";

import React, { useEffect } from "react";
import OrderDetails from "./OrderDetails";
import Link from "next/link";
import { ORDER_URL } from "@/utils/appUrls";

interface OrderModalProps {
  isOpen?: boolean;
  orderNo?: string | null;
  onClose?: () => void;
  // Legacy props fallback
  showDetails?: boolean;
  showEdit?: boolean;
  toggleModal?: (val: boolean) => void;
  order?: any;
}

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  orderNo,
  onClose,
  showDetails,
  toggleModal,
  order,
}) => {
  const visible = isOpen ?? Boolean(showDetails);
  const activeOrderNo = orderNo || order?.orderNo;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (toggleModal) {
      toggleModal(false);
    }
  };

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  if (!visible || !activeOrderNo) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 text-lg shadow-2xs">
              📦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Order Details
                </h3>
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  #{activeOrderNo}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Inspect items, live tracking, invoice and delivery progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`${ORDER_URL}/${activeOrderNo}`}
              onClick={handleClose}
              title="Open specific order page"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
            >
              <span>Go to Order Page</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>

            <button
              onClick={handleClose}
              aria-label="Close modal"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          <OrderDetails orderNo={activeOrderNo} isModal={true} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
