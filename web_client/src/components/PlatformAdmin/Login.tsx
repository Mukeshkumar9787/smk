"use client";

import React, { useState } from "react";
import Link from "next/link";
import { loginPlatformAdmin } from "@/http/apiCalls";
import { notifyError, notifySuccess } from "@/utils/notify";

export default function PlatformAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginPlatformAdmin({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res?.success || !res?.data?.token) {
        const msg = res?.message || "Invalid platform administrator credentials.";
        setErrorMessage(msg);
        notifyError(msg);
        return;
      }

      // Store platform token and admin metadata
      const token = res.data.token;
      localStorage.setItem("platform_token", token);
      localStorage.setItem("token", token);
      localStorage.setItem("platform_admin", JSON.stringify(res.data.admin || {}));

      notifySuccess("Welcome, Platform Administrator!");
      // Immediate full navigation into the platform admin overview
      window.location.href = "/platform-admin";
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Authentication failed. Please check your credentials.";
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)",
        color: "#0f172a",
      }}
    >
      {/* Return to Storefront link */}
      <div className="mb-6 w-full max-w-md flex items-center justify-between px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-slate-900"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Return to Storefront
        </Link>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#047857",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </span>
      </div>

      <div
        className="w-full max-w-md overflow-hidden rounded-3xl p-8 sm:p-10"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header Icon & Title */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: "#eef2ff",
              border: "1px solid #e0e7ff",
              color: "#4f46e5",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase"
            style={{
              backgroundColor: "#eef2ff",
              color: "#4338ca",
              border: "1px solid #c7d2fe",
            }}
          >
            Platform Super Admin
          </span>
          <h1
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0f172a", letterSpacing: "-0.02em" }}
          >
            SMK Control Plane
          </h1>
          <p className="mt-2 text-xs leading-5" style={{ color: "#64748b" }}>
            Dedicated administrative access for multi-tenant stores, AI chatbot services, and system metrics.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl p-4 text-xs font-medium"
            style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
            }}
          >
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1 leading-5">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>
              Administrator Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>
                Master Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-medium transition hover:underline"
                style={{ color: "#4f46e5" }}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
              color: "#ffffff",
              boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.35)",
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Platform Admin"}
          </button>
        </form>

        <div
          className="mt-8 border-t pt-6 text-center text-[11px]"
          style={{ borderColor: "#f1f5f9", color: "#94a3b8" }}
        >
          Protected environment. Authentication requests are monitored and encrypted.
        </div>
      </div>
    </div>
  );
}
