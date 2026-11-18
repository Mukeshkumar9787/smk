import type { Metadata } from "next";
import BrandingPage from "@/components/Config/BrandingPage";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Branding & Theme",
  "Customize your store logo, color theme, and SEO identity."
);

export default function Page() {
  return <BrandingPage />;
}
