import React from "react";
import type { Metadata } from "next";
import { Wishlist } from "@/components/Wishlist";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Wishlist",
  "View and manage your saved favorite products on SMK."
);

const WishlistPage = () => {
  return <Wishlist />;
};

export default WishlistPage;
