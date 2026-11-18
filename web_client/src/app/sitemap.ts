import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import {
  fetchActiveCategoriesServer,
  fetchAllActiveProductsServer,
} from "@/lib/seoServer";
import {
  fetchCurrentTenantServer,
  getServerTenantBasePath,
} from "@/lib/tenantServer";
import { withTenantPath } from "@/lib/tenantUrl";

export const dynamic = "force-dynamic";

const SITEMAP_FETCH_OPTIONS = {
  timeoutMs: 20000,
  retries: 1,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [tenant, basePath] = await Promise.all([
    fetchCurrentTenantServer(),
    getServerTenantBasePath(),
  ]);
  const fullUrl = (path: string) => `${SITE_URL}${withTenantPath(path, basePath)}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: fullUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: fullUrl("/shop"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: fullUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...(tenant?.isDefault && !basePath
      ? [
          {
            url: `${SITE_URL}/launch`,
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
        ]
      : []),
  ];

  const [products, categories] = await Promise.all([
    fetchAllActiveProductsServer(300, SITEMAP_FETCH_OPTIONS),
    fetchActiveCategoriesServer(false, 300, SITEMAP_FETCH_OPTIONS),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => Boolean(category?.slug))
    .map((category) => ({
      url: fullUrl(`/shop?category=${encodeURIComponent(category.slug)}`),
      lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product) => Boolean(product?.slug))
    .map((product) => ({
      url: fullUrl(`/shop-details/${encodeURIComponent(product.slug)}`),
      lastModified: (product as any).updatedAt
        ? new Date((product as any).updatedAt)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
