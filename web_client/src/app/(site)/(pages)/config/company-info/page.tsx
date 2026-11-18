import type { Metadata } from "next";
import CompanyInfoPage from "@/components/Config/CompanyInfoPage";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Company Info");

const Page = () => {
  return <CompanyInfoPage />;
};

export default Page;
