import React from "react";
import type { Metadata } from "next";
import Product from "@/components/Product";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Products Management");

const ProductList = () => {
  return <Product />;
};

export default ProductList;
