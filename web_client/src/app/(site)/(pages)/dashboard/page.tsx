import React from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Admin Dashboard");

const DashboardPage = () => {
  return <Dashboard />;
};

export default DashboardPage;
