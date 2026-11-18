import React from "react";
import type { Metadata } from "next";
import AuditLogs from "@/components/AuditLogs";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Audit Logs");

const AuditLogsPage = () => {
  return <AuditLogs />;
};

export default AuditLogsPage;
