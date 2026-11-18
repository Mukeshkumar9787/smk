import React from "react";
import type { Metadata } from "next";
import CategoryForm from "@/components/Category/Form";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Manage Category");

const NewCategoryPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <CategoryForm params={await params} />;
};

export default NewCategoryPage;
