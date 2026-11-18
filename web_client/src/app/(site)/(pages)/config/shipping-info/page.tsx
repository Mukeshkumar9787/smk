import type { Metadata } from "next";
import ShippingInfoPage from "@/components/Config/ShippingInfoPage";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Shipping Settings");

const Page = () => {
  return <ShippingInfoPage />;
};

export default Page;
