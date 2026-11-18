import React from "react";
import type { Metadata } from "next";
import MailSuccess from "@/components/MailSuccess";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Message Sent",
  "Your message has been sent to our support team."
);

const MailSuccessPage = () => {
  return <MailSuccess />;
};

export default MailSuccessPage;
