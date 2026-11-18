import React from "react";
import type { Metadata } from "next";
import SizeForm from "@/components/Size/Form";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Manage Size");

const NewPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  return <SizeForm params={await params} />;
};

export default NewPage;
