import React from "react";
import type { Metadata } from "next";
import Category from "@/components/Category";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Categories Management");

const CategoryPage = () => {
  return <Category />;
};

export default CategoryPage;
