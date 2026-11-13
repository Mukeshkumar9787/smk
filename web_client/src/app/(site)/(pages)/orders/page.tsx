import React from "react";
import { Metadata } from "next";
import OrdersHub from "@/components/Orders/OrdersHub";

export const metadata: Metadata = {
  title: "Orders | SMK Store",
  description: "Track your orders, view delivery milestones, and inspect invoices.",
};

const OrdersPage = () => {
  return <OrdersHub />;
};

export default OrdersPage;
