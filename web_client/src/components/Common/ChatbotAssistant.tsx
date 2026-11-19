"use client";

import Script from "next/script";
import { useTenant } from "@/app/context/TenantContext";

/**
 * Embeds the Customer Support RAG Assistant according to:
 * 1. Tenant Plan accessibility (aiChatbotEnabled on plan or primary default store)
 * 2. Store Owner's Feature Toggle (aiChatbotActive !== false)
 */
export default function ChatbotAssistant() {
  const { tenant, branding } = useTenant();

  // Store-level feature toggle: enabled/disabled directly
  const isChatbotActive = branding?.aiChatbotActive !== false;

  if (!isChatbotActive) {
    return null;
  }

  const embedUrl =
    process.env.NEXT_PUBLIC_CHATBOT_EMBED_URL ||
    (process.env.NEXT_PUBLIC_CHATBOT_URL
      ? `${process.env.NEXT_PUBLIC_CHATBOT_URL.replace(/\/+$/, "")}/embed.js`
      : undefined);

  if (!embedUrl) {
    return null;
  }

  const scriptSrc = embedUrl.endsWith(".js")
    ? embedUrl
    : `${embedUrl.replace(/\/+$/, "")}/embed.js`;

  const queryParams = new URLSearchParams();
  if (tenant?.slug) queryParams.set("tenant", tenant.slug);
  if (tenant?.id) queryParams.set("tenantId", tenant.id);
  const storeDisplayName = branding?.storeName || tenant?.name || "";
  if (storeDisplayName) queryParams.set("storeName", storeDisplayName);
  if (branding?.primaryColor) queryParams.set("primaryColor", branding.primaryColor);
  if (branding?.accentColor) queryParams.set("accentColor", branding.accentColor);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const finalScriptSrc = `${scriptSrc}${queryString}`;

  return (
    <Script
      src={finalScriptSrc}
      strategy="lazyOnload"
      id="smk-chatbot-embed-script"
      data-tenant-id={tenant?.id || ""}
      data-tenant-slug={tenant?.slug || ""}
      data-store-name={storeDisplayName}
      data-primary-color={branding?.primaryColor || ""}
      data-accent-color={branding?.accentColor || ""}
    />
  );
}
