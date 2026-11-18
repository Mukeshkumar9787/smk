import React from "react";
import type { Metadata } from "next";
import BlogDetails from "@/components/BlogDetails";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Blog Article");

const BlogDetailsPage = () => {
  return <BlogDetails />;
};

export default BlogDetailsPage;
