import React from "react";
import type { Metadata } from "next";
import ProductForm from "@/components/Product/Form";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Manage Product");

const ProductPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <ProductForm params={await params} />;
};

export default ProductPage;
