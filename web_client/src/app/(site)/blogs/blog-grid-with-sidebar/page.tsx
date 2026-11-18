import React from "react";
import type { Metadata } from "next";
import BlogGridWithSidebar from "@/components/BlogGridWithSidebar";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Blog");

const BlogGridWithSidebarPage = () => {
  return <BlogGridWithSidebar />;
};

export default BlogGridWithSidebarPage;
