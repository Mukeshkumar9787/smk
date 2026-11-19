"use client";

import React, { useEffect, useState } from "react";
import {
  checkStoreSlugAvailability,
  provisionTenantStore,
} from "@/http/apiCalls";
import { THEME_PRESETS } from "@/lib/theme";
import { getTenantStorageKey } from "@/lib/tenantUrl";
import { getLoggedInUserData, getStoredToken } from "@/utils/helper";
import { notifyError, notifySuccess } from "@/utils/notify";
import Link from "next/link";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function LaunchStore() {
  const [enableChatbot, setEnableChatbot] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    reason?: string | null;
  }>({ checking: false, available: null, reason: null });
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(THEME_PRESETS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "authorized" | "forbidden">("checking");

  useEffect(() => {
    const checkAccess = async () => {
      if (!getStoredToken()) {
        window.location.href = "/platform-admin/login";
        return;
      }
      try {
        const user = await getLoggedInUserData();
        if (!user || !user.isPlatformAdmin) {
          window.location.href = "/platform-admin/login";
          return;
        }
        setAuthState("authorized");
      } catch (err) {
        console.error(err);
        setAuthState("forbidden");
      }
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (authState !== "authorized") return;
    const cleaned = slugify(slug);
    if (!cleaned || cleaned.length < 2) {
      setSlugStatus({ checking: false, available: null, reason: null });
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus({ checking: true, available: null, reason: null });
      try {
        const res = await checkStoreSlugAvailability(cleaned);
        if (res?.success && res?.data) {
          setSlugStatus({
            checking: false,
            available: Boolean(res.data.available),
            reason: res.data.reason || null,
          });
        } else {
          setSlugStatus({ checking: false, available: null, reason: null });
        }
      } catch {
        setSlugStatus({ checking: false, available: null, reason: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, authState]);

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugStatus.available === false) {
      notifyError(slugStatus.reason || "Please choose a different store URL slug.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await provisionTenantStore({
        storeName,
        slug: slugify(slug || storeName),
        ownerName,
        ownerEmail,
        ownerPassword,
        ownerMobile,
        aiChatbotEnabled: enableChatbot,
        primaryColor: selectedPreset.primaryColor,
        accentColor: selectedPreset.accentColor,
      });

      if (!res?.success || !res?.data?.tenant?.slug) {
        notifyError(res?.message || "Unable to create store.");
        return;
      }

      const { tenant, token } = res.data;
      if (token) {
        localStorage.setItem(getTenantStorageKey("token", tenant.slug), token);
      }
      notifySuccess(`Store "${tenant.name}" is live! Opening your branding studio...`);
      window.location.href = `/s/${encodeURIComponent(tenant.slug)}/config/branding`;
    } catch (err) {
      notifyError("Failed to launch store.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authState === "checking") {
    return (
      <section className="page-section">
        <div className="mx-auto flex min-h-[420px] max-w-[1170px] flex-col items-center justify-center px-4">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Verifying Platform Super Admin access...</p>
        </div>
      </section>
    );
  }

  if (authState === "forbidden") {
    return (
      <section className="page-section">
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-dark">Access Restricted</h1>
            <p className="mt-3 text-sm text-dark-4">
              Only the Platform Super Admin can create and provision new stores.
            </p>
            <Link
              href="/platform-admin/login"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-dark"
            >
              Sign In as Platform Admin
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        {/* Back to Platform Admin */}
        <div className="mb-4">
          <Link
            href="/platform-admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue hover:text-blue-dark transition"
          >
            &larr; Back to Platform Governance
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-10 rounded-[34px] border border-sky-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
          <span className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Multi-Tenant Commerce Platform
          </span>
          <h1 className="mt-4 max-w-[680px] text-3xl font-semibold tracking-tight text-dark sm:text-4xl xl:text-[42px] xl:leading-[1.08]">
            Launch your own isolated e-commerce storefront in under 60 seconds.
          </h1>
          <p className="mt-4 max-w-[650px] text-base leading-7 text-dark-4">
            Get a dedicated admin workspace, full data isolation, custom logo &amp; color theme studio, SEO-ready product catalog, and real-time order management.
          </p>
        </div>

        {/* Provisioning Capabilities & Chatbot Config */}
        <div className="mb-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue mb-3">
                ✨ Independent Multi-Tenant Architecture
              </span>
              <h3 className="text-xl font-bold text-dark">Enterprise-Grade E-Commerce Platform</h3>
              <p className="mt-1.5 text-sm leading-6 text-dark-4 max-w-xl">
                Every store is provisioned with complete data isolation, unlimited product catalog, theme studio, dedicated store URL, and direct administrator access.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shrink-0">
              <input
                id="enable-chatbot"
                type="checkbox"
                checked={enableChatbot}
                onChange={(e) => setEnableChatbot(e.target.checked)}
                className="h-5 w-5 rounded text-blue focus:ring-blue cursor-pointer"
              />
              <label htmlFor="enable-chatbot" className="cursor-pointer">
                <span className="block text-sm font-bold text-dark">🤖 Enable AI Support Chatbot</span>
                <span className="block text-xs text-slate-500">
                  Activates dedicated RAG chatbot & knowledge base
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Store Provisioning Form */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-semibold text-dark">Create Your Store Account</h2>
          <p className="mt-1 text-sm text-dark-4">
            Your storefront will be provisioned immediately with isolated data, starter categories/sizes/colors, and full admin access.
          </p>

          <form onSubmit={handleLaunch} className="mt-6 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="e.g. Urban Threads"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Store URL Slug *
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <span className="text-xs text-slate-500">/s/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="urban-threads"
                    className="w-full bg-transparent px-2 py-3 text-sm text-dark focus:outline-none"
                  />
                </div>
                {slugStatus.checking && (
                  <p className="mt-1 text-xs text-slate-500">Checking availability...</p>
                )}
                {!slugStatus.checking && slugStatus.available === true && (
                  <p className="mt-1 text-xs font-medium text-green-dark">
                    ✔ /s/{slug} is available!
                  </p>
                )}
                {!slugStatus.checking && slugStatus.available === false && (
                  <p className="mt-1 text-xs font-medium text-red">
                    ✖ {slugStatus.reason || "Slug unavailable"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Owner Email *
                </label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="founder@yourbrand.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                />
              </div>
            </div>

            {/* Starter Theme Picker */}
            <div>
              <p className="mb-2.5 text-sm font-medium text-dark">
                Choose Starting Color Theme (you can customize anytime)
              </p>
              <div className="flex flex-wrap gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const isActive = selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                        isActive
                          ? "border-blue bg-blue-light-5/70 text-dark ring-2 ring-blue/20"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-dark disabled:opacity-60"
              >
                {submitting ? "Provisioning Your Store..." : "Launch My Store Now →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
