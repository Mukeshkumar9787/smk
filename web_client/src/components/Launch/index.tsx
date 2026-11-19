"use client";

import React, { useEffect, useState } from "react";
import {
  checkStoreSlugAvailability,
  getTenantPlans,
  provisionTenantStore,
} from "@/http/apiCalls";
import { THEME_PRESETS } from "@/lib/theme";
import { getTenantStorageKey } from "@/lib/tenantUrl";
import { getLoggedInUserData, getStoredToken, redirectToSignIn } from "@/utils/helper";
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
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("STARTER");
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
    const checkAccessAndLoadPlans = async () => {
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

        const res = await getTenantPlans();
        if (res?.success && Array.isArray(res.data)) {
          setPlans(res.data);
          if (res.data[0]?.code) setSelectedPlan(res.data[0].code);
        }
      } catch (err) {
        console.error(err);
        setAuthState("forbidden");
      }
    };
    checkAccessAndLoadPlans();
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
        planCode: selectedPlan,
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

        {/* Plans */}
        <div className="mb-10 grid gap-5 md:grid-cols-3">
          {(plans.length > 0
            ? plans
            : [
                {
                  code: "STARTER",
                  name: "Starter",
                  priceMonthly: 999,
                  maxProducts: 50,
                  description: "Branded storefront, logo upload, color theme studio, up to 50 products.",
                },
                {
                  code: "GROWTH",
                  name: "Growth",
                  priceMonthly: 2499,
                  maxProducts: 500,
                  customDomainAllowed: true,
                  description: "Custom domain support, up to 500 products, and priority commerce tools.",
                },
                {
                  code: "PRO",
                  name: "Pro AI",
                  priceMonthly: 4999,
                  maxProducts: 5000,
                  customDomainAllowed: true,
                  aiChatbotEnabled: true,
                  autoProcurementEnabled: true,
                  description: "Full AI shopping assistant, automated restock agents, and scale limits.",
                },
              ]
          ).map((plan) => {
            const active = selectedPlan === plan.code;
            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => setSelectedPlan(plan.code)}
                className={`flex flex-col justify-between rounded-[28px] border p-6 text-left transition ${
                  active
                    ? "border-blue bg-white shadow-[0_20px_50px_rgba(60,80,224,0.14)] ring-2 ring-blue/20"
                    : "border-slate-200 bg-white/80 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-dark">{plan.name}</span>
                    {active && (
                      <span className="rounded-full bg-blue px-2.5 py-0.5 text-xs font-semibold text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-bold text-dark">
                    ₹{plan.priceMonthly}
                    <span className="text-sm font-normal text-dark-4"> / month</span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-dark-4">{plan.description}</p>
                </div>

                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <li>✔ Up to {plan.maxProducts} isolated products</li>
                  <li>✔ Custom logo &amp; color theme studio</li>
                  <li>✔ Dedicated store admin &amp; analytics</li>
                  {plan.customDomainAllowed && <li>✔ Custom domain ready</li>}
                  {plan.aiChatbotEnabled && <li>✔ AI RAG support chatbot</li>}
                </ul>
              </button>
            );
          })}
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
