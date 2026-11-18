import type { Metadata } from "next";
import LaunchStore from "@/components/Launch";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Create New Store",
  "Platform Super Admin store provisioning."
);

export default function LaunchPage() {
  return <LaunchStore />;
}
