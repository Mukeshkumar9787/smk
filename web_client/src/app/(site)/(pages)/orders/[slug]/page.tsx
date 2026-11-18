import React from "react";
import type { Metadata } from "next";
import OrderDetails from "@/components/Orders/OrderDetails";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Order Details",
  "View itemized summary, shipping status, and invoice for your SMK order."
);

const OrdersPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <OrderDetails params={await params} />;
};

export default OrdersPage;
