import type { Metadata } from "next";
import LaunchStore from "@/components/Launch";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata({
  title: "Launch Your Online Store",
  description:
    "Create your own isolated multi-tenant e-commerce storefront with custom logo, color theme, and admin dashboard in seconds.",
  path: "/launch",
  keywords: ["create online store", "multi-tenant ecommerce", "SMK platform"],
});

export default function LaunchPage() {
  return <LaunchStore />;
}
