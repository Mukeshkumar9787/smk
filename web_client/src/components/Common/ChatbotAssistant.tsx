"use client";

import Script from "next/script";
import { useTenant } from "@/app/context/TenantContext";

/**
 * Embeds the SMK Customer Support RAG Assistant on the main SMK store only
 * so isolated tenant storefronts remain fully white-labeled.
 */
export default function ChatbotAssistant() {
  const { tenant } = useTenant();

  if (!tenant?.isDefault) {
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
