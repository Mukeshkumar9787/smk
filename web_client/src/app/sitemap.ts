import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import {
  fetchActiveCategoriesServer,
  fetchActiveProductsServer,
} from "@/lib/seoServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const [productsResult, categories] = await Promise.all([
    fetchActiveProductsServer({ pagination: false }, 300),
    fetchActiveCategoriesServer(false, 300),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => Boolean(category?.slug))
    .map((category) => ({
      url: `${SITE_URL}/shop?category=${encodeURIComponent(category.slug)}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = productsResult.products
    .filter((product) => Boolean(product?.slug))
    .map((product) => ({
      url: `${SITE_URL}/shop-details/${encodeURIComponent(product.slug)}`,
      lastModified: (product as any).updatedAt
        ? new Date((product as any).updatedAt)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
