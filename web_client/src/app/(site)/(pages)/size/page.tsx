import React from "react";
import type { Metadata } from "next";
import Size from "@/components/Size";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Sizes Management");

const SizePage = () => {
  return <Size />;
};

export default SizePage;
