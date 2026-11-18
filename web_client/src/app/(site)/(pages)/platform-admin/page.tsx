import type { Metadata } from "next";
import PlatformAdmin from "@/components/PlatformAdmin";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Platform Super Admin",
  "Manage all multi-tenant stores, plans, and platform metrics."
);

export default function PlatformAdminPage() {
  return <PlatformAdmin />;
}
