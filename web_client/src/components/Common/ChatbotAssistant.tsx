"use client";

import Script from "next/script";

/**
 * Embeds the SMK Customer Support RAG Assistant in the store web client.
 * Driven by NEXT_PUBLIC_CHATBOT_EMBED_URL in .env.
 */
export default function ChatbotAssistant() {
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

