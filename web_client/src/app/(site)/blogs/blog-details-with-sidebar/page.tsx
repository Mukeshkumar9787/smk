import React from "react";
import type { Metadata } from "next";
import BlogDetailsWithSidebar from "@/components/BlogDetailsWithSidebar";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Blog Article");

const BlogDetailsWithSidebarPage = () => {
  return <BlogDetailsWithSidebar />;
};

export default BlogDetailsWithSidebarPage;
