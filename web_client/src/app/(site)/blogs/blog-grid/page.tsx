import React from "react";
import type { Metadata } from "next";
import BlogGrid from "@/components/BlogGrid";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Blog");

const BlogGridPage = () => {
  return <BlogGrid />;
};

export default BlogGridPage;
