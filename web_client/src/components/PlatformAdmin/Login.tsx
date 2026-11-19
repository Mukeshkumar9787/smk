"use client";

import React, { useState } from "react";
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
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-3xl border border-indigo-500/30 text-indigo-400 shadow-inner">
            🛡️
          </div>
          <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase border border-indigo-500/20">
            Platform Super Admin
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            SMK Control Plane
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Dedicated administrative authentication. Decoupled from store-level tenant accounts.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            <span className="text-base">⚠️</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Platform Admin Email
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter master admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In to Platform Admin"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-[11px] text-slate-500">
          This portal manages multi-tenant provisioning, store status, and AI chatbot lifecycle.
        </div>
      </div>
    </div>
  );
}
