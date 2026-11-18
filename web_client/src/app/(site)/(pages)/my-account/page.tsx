import React from "react";
import type { Metadata } from "next";
import MyAccount from "@/components/MyAccount";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "My Account",
  "View and update your SMK profile, addresses, and recent orders."
);

const MyAccountPage = () => {
  return <MyAccount />;
};

export default MyAccountPage;
