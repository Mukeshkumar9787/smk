import type { Metadata } from "next";
import CourierPage from "@/components/Config/CourierPage";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Courier Settings");

const Page = () => {
  return <CourierPage />;
};

export default Page;
