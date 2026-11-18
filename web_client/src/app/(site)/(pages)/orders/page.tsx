import React from "react";
import type { Metadata } from "next";
import OrdersHub from "@/components/Orders/OrdersHub";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Orders",
  "Track your SMK orders, view delivery milestones, and inspect invoices."
);

const OrdersPage = () => {
  return <OrdersHub />;
};

export default OrdersPage;
