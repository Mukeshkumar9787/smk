import React from "react";
import type { Metadata } from "next";
import Error from "@/components/Error";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Page Not Found",
  "The page you requested could not be found."
);

export default function NotFound() {
  return <Error />;
}
