import React from "react";
import type { Metadata } from "next";
import ColorForm from "@/components/Color/Form";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Manage Color");

const NewPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <ColorForm params={await params} />;
};

export default NewPage;
