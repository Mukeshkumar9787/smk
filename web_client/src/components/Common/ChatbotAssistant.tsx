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

  // Plan accessibility check
  const isPlanAllowed = Boolean(tenant?.isDefault || tenant?.plan?.aiChatbotEnabled);

  // Store-level feature toggle
  const isChatbotActive = branding?.aiChatbotActive !== false;

  if (!isPlanAllowed || !isChatbotActive) {
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

  return (
    <Script
      src={scriptSrc}
      strategy="lazyOnload"
      id="smk-chatbot-embed-script"
    />
  );
}
