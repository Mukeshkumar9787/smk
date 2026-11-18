import React from "react";
import type { Metadata } from "next";
import Hsn from "@/components/Hsn";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("HSN Management");

const HsnPage = () => {
  return <Hsn />;
};

export default HsnPage;
