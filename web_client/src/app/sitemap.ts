import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import {
  fetchActiveCategoriesServer,
  fetchAllActiveProductsServer,
} from "@/lib/seoServer";

export const dynamic = "force-dynamic";

const SITEMAP_FETCH_OPTIONS = {
  timeoutMs: 20000,
  retries: 1,
};

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

  const [products, categories] = await Promise.all([
    fetchAllActiveProductsServer(300, SITEMAP_FETCH_OPTIONS),
    fetchActiveCategoriesServer(false, 300, SITEMAP_FETCH_OPTIONS),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => Boolean(category?.slug))
    .map((category) => ({
      url: `${SITE_URL}/shop?category=${encodeURIComponent(category.slug)}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = products
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
