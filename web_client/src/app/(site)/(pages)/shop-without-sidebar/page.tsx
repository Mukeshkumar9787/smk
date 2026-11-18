import React from "react";
import type { Metadata } from "next";
import ShopWithoutSidebar from "@/components/ShopWithoutSidebar";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Shop Catalog",
  "Browse SMK products."
);

const ShopWithoutSidebarPage = () => {
  return <ShopWithoutSidebar />;
};

export default ShopWithoutSidebarPage;
