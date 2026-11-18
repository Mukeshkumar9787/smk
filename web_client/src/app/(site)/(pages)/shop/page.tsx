import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShopWithSidebar from "@/components/ShopWithSidebar";
import JsonLd from "@/components/Common/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildPublicMetadata,
} from "@/lib/seo";
import {
  fetchActiveCategoriesServer,
  fetchActiveProductsServer,
} from "@/lib/seoServer";
import {
  fetchCurrentTenantServer,
  fetchTenantResolutionServer,
  getServerTenantBasePath,
} from "@/lib/tenantServer";

export const dynamic = "force-dynamic";

type ShopSearchParams = {
  category?: string;
  size?: string;
  color?: string;
  search?: string;
};

function humanizeSlug(slug: string): string {
  return decodeURIComponent(slug || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const [params, { tenant, errorCode }, basePath] = await Promise.all([
    searchParams,
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);
  if (errorCode) {
    return {
      title: errorCode === "TENANT_SUSPENDED" ? "Store Unavailable" : "Store Not Found",
      robots: { index: false, follow: false },
    };
  }
  const storeName = tenant?.branding?.storeName || "SMK";
  const categorySlug = typeof params?.category === "string" ? params.category.trim() : "";
  const hasFacetFilters = Boolean(params?.size || params?.color || params?.search);

  let categoryTitle = "";
  if (categorySlug) {
    const categories = await fetchActiveCategoriesServer(false, 300);
    const match = categories.find((c) => c.slug === categorySlug);
    categoryTitle = match?.title || humanizeSlug(categorySlug);
  }

  const title = categoryTitle ? `${categoryTitle} — Shop` : "Shop All Products";
  const description = categoryTitle
    ? `Explore ${categoryTitle} at ${storeName}. Compare pricing, sizes, colors, and real-time availability with secure online checkout.`
    : `Browse the ${storeName} catalog with curated collections, filters by category, size, and color, and transparent pricing.`;
  const canonicalPath = categorySlug
    ? `${basePath}/shop?category=${encodeURIComponent(categorySlug)}`
    : `${basePath}/shop`;

  return buildPublicMetadata({
    title,
    description,
    path: canonicalPath,
    siteName: storeName,
    noIndex: hasFacetFilters,
    images: tenant?.branding?.logoUrl
      ? [{ url: tenant.branding.logoUrl, alt: storeName }]
      : undefined,
    keywords: [
      storeName,
      "shop online",
      ...(categoryTitle ? [categoryTitle, `buy ${categoryTitle} online`] : ["catalog", "new arrivals"]),
    ],
  });
}

const ShopWithSidebarPage = async ({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) => {
  const [params, { tenant, errorCode }, basePath] = await Promise.all([
    searchParams,
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);
  if (errorCode) return null;
  const storeName = tenant?.branding?.storeName || "SMK";
  const category = typeof params?.category === "string" ? params.category : undefined;
  const size = typeof params?.size === "string" ? params.size : undefined;
  const color = typeof params?.color === "string" ? params.color : undefined;
  const search = typeof params?.search === "string" ? params.search : undefined;

  const [productsResult, categories] = await Promise.all([
    fetchActiveProductsServer(
      {
        pageNumber: 1,
        pageSize: 6,
        category,
        size,
        color,
        search,
      },
      120
    ),
    fetchActiveCategoriesServer(true, 300),
  ]);

  const activeCategory = category
    ? categories.find((c) => c.slug === category)
    : undefined;
  const activeCategoryTitle =
    activeCategory?.title || (category ? humanizeSlug(category) : "");

  const collectionPath = category
    ? `${basePath}/shop?category=${encodeURIComponent(category)}`
    : `${basePath}/shop`;
  const collectionTitle = activeCategoryTitle
    ? `${activeCategoryTitle} | ${storeName}`
    : `Shop | ${storeName}`;
  const collectionDescription = activeCategoryTitle
    ? `Browse ${activeCategoryTitle} products available at ${storeName}.`
    : `Browse all products in the ${storeName} catalog.`;

  const breadcrumbs = [
    { name: "Home", path: basePath || "/" },
    { name: "Shop", path: `${basePath}/shop` },
    ...(activeCategoryTitle && category
      ? [{ name: activeCategoryTitle, path: collectionPath }]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd(
          productsResult.products,
          collectionTitle,
          collectionDescription,
          collectionPath,
          basePath
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Suspense fallback={null}>
        <ShopWithSidebar
          initialProducts={productsResult.products}
          initialTotalCount={productsResult.totalCount}
          initialCategories={categories}
          initialFetched={productsResult.fetched}
          activeCategoryTitle={activeCategoryTitle}
        />
      </Suspense>
    </>
  );
};

export default ShopWithSidebarPage;
