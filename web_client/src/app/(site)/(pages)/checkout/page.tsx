import React from "react";
import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Checkout",
  "Complete your order securely."
);

const CheckoutPage = () => {
  return <Checkout />;
};

export default CheckoutPage;
