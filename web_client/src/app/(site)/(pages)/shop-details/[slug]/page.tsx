import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopDetails from "@/components/ShopDetails";
import JsonLd from "@/components/Common/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildNoIndexMetadata,
  buildProductJsonLd,
  buildPublicMetadata,
  extractProductImageUrls,
  truncateDescription,
} from "@/lib/seo";
import {
  fetchProductBySlugServer,
  fetchProductReviewsServer,
} from "@/lib/seoServer";
import {
  fetchCurrentTenantServer,
  fetchTenantResolutionServer,
  getServerTenantBasePath,
} from "@/lib/tenantServer";

export const dynamic = "force-dynamic";

function humanizeSlug(slug: string): string {
  return decodeURIComponent(slug || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, { tenant, errorCode }, basePath] = await Promise.all([
    params,
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
  const { product, notFound: isNotFound } = await fetchProductBySlugServer(slug);

  if (isNotFound) {
    return buildNoIndexMetadata(
      "Product Not Found",
      `This product is no longer available on ${storeName}.`
    );
  }

  if (!product) {
    const fallbackTitle = humanizeSlug(slug) || "Product Details";
    return buildPublicMetadata({
      title: fallbackTitle,
      description: `Shop ${fallbackTitle} online at ${storeName} with transparent pricing and secure checkout.`,
      path: `${basePath}/shop-details/${encodeURIComponent(slug)}`,
      siteName: storeName,
    });
  }

  const imageUrls = extractProductImageUrls(product);
  const priceText = `₹${product.price}`;
  const description = truncateDescription(
    product.description ||
      `Buy ${product.title} online at ${storeName} for ${priceText}. Check real-time stock, ratings, and order securely.`,
    155
  );

  return buildPublicMetadata({
    title: product.title,
    description,
    path: `${basePath}/shop-details/${encodeURIComponent(product.slug)}`,
    siteName: storeName,
    images: imageUrls.map((url) => ({ url, alt: product.title })),
    keywords: [
      product.title,
      storeName,
      ...(product.sizeTitle ? [`${product.title} ${product.sizeTitle}`] : []),
      "buy online",
    ],
  });
}

const ShopDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const [resolvedParams, { tenant, errorCode }, basePath] = await Promise.all([
    params,
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);
  if (errorCode) return null;
  const storeName = tenant?.branding?.storeName || "SMK";
  const { product, notFound: isNotFound } = await fetchProductBySlugServer(
    resolvedParams.slug
  );

  if (isNotFound) {
    notFound();
  }

  const initialReviews = product?.id
    ? await fetchProductReviewsServer(product.id)
    : [];

  return (
    <>
      {product && (
        <>
          <JsonLd
            data={buildProductJsonLd(product, initialReviews, {
              siteName: storeName,
              basePath,
            })}
          />
          <JsonLd
            data={buildBreadcrumbJsonLd([
              { name: "Home", path: basePath || "/" },
              { name: "Shop", path: `${basePath}/shop` },
              {
                name: product.title,
                path: `${basePath}/shop-details/${encodeURIComponent(product.slug)}`,
              },
            ])}
          />
        </>
      )}
      <ShopDetails
        params={resolvedParams}
        initialProduct={product}
        initialReviews={initialReviews}
      />
    </>
  );
};

export default ShopDetailsPage;
