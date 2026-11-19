"use client";

import React, { useEffect, useState } from "react";
import SectionPageLayout from "./SectionPageLayout";
import {
  getCurrentTenantBranding,
  getCurrentTenantSubscription,
  updateCurrentTenantBranding,
  uploadFile,
} from "@/http/apiCalls";
import { useTenant } from "@/app/context/TenantContext";
import { THEME_PRESETS, FONT_OPTIONS, darkenHex } from "@/lib/theme";
import { notifyError, notifySuccess } from "@/utils/notify";

const BrandingPage = () => {
  const { tenant, branding, updateBrandingLocally, setTenant } = useTenant();
  const [form, setForm] = useState({
    storeName: branding.storeName || "",
    tagline: branding.tagline || "",
    logoUrl: branding.logoUrl || "",
    primaryColor: branding.primaryColor || "#3C50E0",
    primaryDarkColor: branding.primaryDarkColor || "#1C3FB7",
    accentColor: branding.accentColor || "#0EA5E9",
    backgroundColor: branding.backgroundColor || "#F6FAFF",
    textPrimaryColor: branding.textPrimaryColor || "#1C274C",
    fontFamily: branding.fontFamily || "Euclid Circular A",
    seoTitle: branding.seoTitle || "",
    seoDescription: branding.seoDescription || "",
    aiChatbotActive: branding.aiChatbotActive !== false,
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandingRes, subRes] = await Promise.all([
          getCurrentTenantBranding(),
          getCurrentTenantSubscription(),
        ]);
        if (brandingRes?.success && brandingRes?.data?.branding) {
          const b = brandingRes.data.branding;
          setTenant(brandingRes.data);
          setForm({
            storeName: b.storeName || "",
            tagline: b.tagline || "",
            logoUrl: b.logoUrl || "",
            primaryColor: b.primaryColor || "#3C50E0",
            primaryDarkColor: b.primaryDarkColor || darkenHex(b.primaryColor || "#3C50E0"),
            accentColor: b.accentColor || "#0EA5E9",
            backgroundColor: b.backgroundColor || "#F6FAFF",
            textPrimaryColor: b.textPrimaryColor || "#1C274C",
            fontFamily: b.fontFamily || "Euclid Circular A",
            seoTitle: b.seoTitle || "",
            seoDescription: b.seoDescription || "",
            aiChatbotActive: b.aiChatbotActive !== false,
          });
        }
        if (subRes?.success && subRes?.data) {
          setSubscriptionInfo(subRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [setTenant]);

  const applyField = (key: string, value: any) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
        ...(key === "primaryColor" ? { primaryDarkColor: darkenHex(value) } : {}),
      };
      updateBrandingLocally(next);
      return next;
    });
  };

  const applyPreset = (preset: (typeof THEME_PRESETS)[number]) => {
    const patch = {
      primaryColor: preset.primaryColor,
      primaryDarkColor: preset.primaryDarkColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
      textPrimaryColor: preset.textPrimaryColor,
    };
    setForm((prev) => ({ ...prev, ...patch }));
    updateBrandingLocally(patch);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await uploadFile(file);
      if (!res?.success || !res?.data?.path) {
        notifyError(res?.message || "Failed to upload logo");
        return;
      }
      applyField("logoUrl", res.data.path);
      notifySuccess("Logo uploaded. Click Save Branding to publish.");
    } catch (err) {
      notifyError("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateCurrentTenantBranding(form);
      if (!res?.success) {
        notifyError(res?.message || "Failed to update branding");
        return;
      }
      if (res?.data) {
        setTenant(res.data);
      }
      notifySuccess("Store branding & color theme published!");
    } catch (err) {
      notifyError("Failed to update branding");
    } finally {
      setSaving(false);
    }
  };

  const storeUrl =
    typeof window !== "undefined"
      ? tenant.isDefault
        ? window.location.origin
        : `${window.location.origin}/s/${tenant.slug}`
      : `/s/${tenant.slug}`;

  const isPlanChatbotAllowed = true;
  const customDomainAllowed = Boolean(tenant.isDefault || tenant.customDomainAllowed);
  const autoProcurementEnabled = true;

  return (
    <SectionPageLayout
      eyebrow="Store Appearance"
      title="Branding & Color Theme"
      description="Upload your own logo, pick your store's color palette, and customize SEO details. Changes apply live across your isolated storefront."
      stats={[
        { label: "Store Slug", value: tenant.slug },
        {
          label: "Store Status",
          value: tenant.status === "ACTIVE" ? "Active" : tenant.status,
        },
        {
          label: "AI Chatbot",
          value: form.aiChatbotActive ? "✔ Active" : "⏸️ Disabled",
        },
      ]}
      onSubmit={handleSubmit}
      isSaving={saving}
      saveLabel="Publish Branding & Theme"
    >
      <div className="space-y-8">
        {/* Live Storefront URL */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Your Live Storefront URL
            </p>
            <p className="mt-1 font-mono text-sm text-dark break-all">{storeUrl}</p>
          </div>
          <a
            href={tenant.isDefault ? "/" : `/s/${tenant.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-dark hover:border-blue hover:text-blue transition"
          >
            View Storefront →
          </a>
        </div>

        {/* AI Chatbot Assistant Controls */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue mb-2">
                🤖 Customer Support Assistant
              </span>
              <h3 className="text-lg font-semibold text-dark">
                AI Chatbot & Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable automated AI customer assistance across your storefront.
              </p>
            </div>
          </div>

          {/* AI Chatbot Feature Toggle */}
          <div className={`rounded-2xl border p-5 transition ${
            isPlanChatbotAllowed
              ? form.aiChatbotActive
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-slate-200 bg-slate-50/50"
              : "border-slate-200 bg-slate-50/70 opacity-90"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${
                  isPlanChatbotAllowed
                    ? form.aiChatbotActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-dark">
                      AI Shopping Assistant (Chatbot Widget)
                    </h4>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      form.aiChatbotActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {form.aiChatbotActive ? "Active on Storefront" : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600 max-w-xl">
                    When enabled, an intelligent floating shopping assistant is embedded on your storefront to assist customers, answer catalog inquiries, and explain shipping & returns.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="sm:self-center shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(form.aiChatbotActive)}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setForm((prev) => ({ ...prev, aiChatbotActive: next }));
                      updateBrandingLocally({ aiChatbotActive: next });
                    }}
                  />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Feature Badges Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Custom Domain</p>
              <p className="mt-1 text-xs font-semibold text-dark flex items-center gap-1.5">
                ✔ Ready &amp; Supported
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Autonomous Restock</p>
              <p className="mt-1 text-xs font-semibold text-dark flex items-center gap-1.5">
                ✔ Enabled
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cloud Media Storage</p>
              <p className="mt-1 text-xs font-semibold text-dark flex items-center gap-1.5">
                💾 High-Performance CDN
              </p>
            </div>
          </div>
        </div>

        {/* Store Identity + Logo */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Store Name
              </label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => applyField("storeName", e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                placeholder="e.g. Nova Apparel"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">
                Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => applyField("tagline", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
                placeholder="Modern everyday essentials"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              Store Logo
            </label>
            <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Store Logo Preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center rounded-lg text-base font-bold text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {(form.storeName || "S").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-dark">
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => applyField("logoUrl", "")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-red"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  PNG, JPG, WebP, or SVG. Stored isolated in your store&apos;s media folder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Presets */}
        <div>
          <p className="mb-3 text-sm font-semibold text-dark">
            Quick Color Theme Presets
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {THEME_PRESETS.map((preset) => {
              const isSelected =
                form.primaryColor.toUpperCase() === preset.primaryColor.toUpperCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-blue bg-blue-light-5/60 ring-2 ring-blue/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-dark">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "primaryColor", label: "Primary Brand Color" },
            { key: "accentColor", label: "Accent / Highlight" },
            { key: "backgroundColor", label: "Page Background" },
            { key: "textPrimaryColor", label: "Heading Text Color" },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-3.5"
            >
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                {label}
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={(form as any)[key]}
                  onChange={(e) => applyField(key, e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={(e) => applyField(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-xs uppercase text-dark"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Typography & Brand Font Selection */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔤</span>
                <h3 className="text-base font-semibold text-dark">
                  Typography &amp; Store Font Family
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred typeface. Changes reflect dynamically across your storefront and AI chatbot widget.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Active: <strong className="font-semibold text-blue">{form.fontFamily || "Euclid Circular A"}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FONT_OPTIONS.map((f) => {
              const isSelected = (form.fontFamily || "Euclid Circular A").toLowerCase() === f.name.toLowerCase();
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => applyField("fontFamily", f.name)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue bg-blue-light-5/50 ring-2 ring-blue/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <p className="text-sm font-bold text-dark group-hover:text-blue transition-colors">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                        {f.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs">
                    <span className="text-xs">Aa Bb Gg 123 — The quick brown fox jumps</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Card */}
        <div
          className="rounded-3xl border border-slate-200 p-6 transition"
          style={{
            backgroundColor: form.backgroundColor,
            fontFamily: form.fontFamily ? `"${form.fontFamily}", sans-serif` : undefined,
          }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live Storefront Preview
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Preview Logo"
                  className="h-9 w-auto max-w-[100px] rounded object-contain"
                />
              ) : (
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  {(form.storeName || "S").slice(0, 2).toUpperCase()}
                </span>
              )}
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ color: form.textPrimaryColor }}
                >
                  {form.storeName || "Your Store"}
                </p>
                <p className="text-xs text-slate-500">
                  {form.tagline || "Curated storefront"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: form.accentColor }}
              >
                20% OFF
              </span>
              <span
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: form.primaryColor }}
              >
                Add to Cart
              </span>
            </div>
          </div>
        </div>

        {/* SEO Overrides */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              SEO Title
            </label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => applyField("seoTitle", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
              placeholder="Brand Name | Online Store"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark">
              SEO Meta Description
            </label>
            <input
              type="text"
              value={form.seoDescription}
              onChange={(e) => applyField("seoDescription", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-dark"
              placeholder="Short description shown on Google Search results"
            />
          </div>
        </div>
      </div>
    </SectionPageLayout>
  );
};

export default BrandingPage;
