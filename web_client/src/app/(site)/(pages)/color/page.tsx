import React from "react";
import type { Metadata } from "next";
import Color from "@/components/Color";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Colors Management");

const ColorPage = () => {
  return <Color />;
};

export default ColorPage;
