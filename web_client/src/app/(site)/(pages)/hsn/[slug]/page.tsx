import React from "react";
import type { Metadata } from "next";
import HsnForm from "@/components/Hsn/Form";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Manage HSN");

const NewHsnPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <HsnForm params={await params} />;
};

export default NewHsnPage;
