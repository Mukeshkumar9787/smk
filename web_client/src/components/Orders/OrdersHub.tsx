"use client";

import React, { useEffect, useState } from "react";
import Orders from "@/components/Orders";
import AdminOrders from "@/components/AdminOrders";
import { getLoggedInUserData, getStoredToken, redirectToSignIn } from "@/utils/helper";
import { ROLE_TYPES } from "@/utils/constants";
import Link from "next/link";

export default function OrdersHub() {
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [adminViewMode, setAdminViewMode] = useState<"customer" | "admin">("customer");

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setIsLoadingAuth(false);
        redirectToSignIn('/orders');
        return;
      }

      try {
        const userData = await getLoggedInUserData();
        if (!userData) {
          setUser(null);
          redirectToSignIn('/orders');
          return;
        }
        setUser(userData);
      } catch (e) {
        setUser(null);
        redirectToSignIn('/orders');
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const isAdmin = user?.role === ROLE_TYPES.ADMIN;

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-xs">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-4xl shadow-inner">
              🔒
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
              Sign in to view your orders
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Please sign in to access your order history, track deliveries live, and manage order invoices.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signin"
                className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Sign in to Account
              </Link>
              <Link
                href="/shop"
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Explore Store
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      {/* Admin Mode Switcher Bar */}
      {isAdmin && (
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 pt-4 flex justify-end">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setAdminViewMode("customer")}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                adminViewMode === "customer"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Customer Orders
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode("admin")}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                adminViewMode === "admin"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Orders (Admin View)
            </button>
          </div>
        </div>
      )}

      {isAdmin && adminViewMode === "admin" ? <AdminOrders /> : <Orders />}
    </div>
  );
}
