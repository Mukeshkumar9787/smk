import React from "react";
import type { Metadata } from "next";
import Cart from "@/components/Cart";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Shopping Cart",
  "Review items in your shopping cart before checkout."
);

const CartPage = () => {
  return <Cart />;
};

export default CartPage;
