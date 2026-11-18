import React from "react";
import type { Metadata } from "next";
import Error from "@/components/Error";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Page Not Found",
  "The requested page could not be found on SMK."
);

const ErrorPage = () => {
  return <Error />;
};

export default ErrorPage;
