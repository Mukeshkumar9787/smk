import type { Metadata } from "next";
import PlatformAdminLogin from "@/components/PlatformAdmin/Login";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Platform Admin Sign In",
  "Dedicated administrative login for SMK platform operators."
);

export default function PlatformAdminLoginPage() {
  return <PlatformAdminLogin />;
}
