import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopDetails from "@/components/ShopDetails";
import JsonLd from "@/components/Common/JsonLd";
import {
  SITE_NAME,
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
  const { slug } = await params;
  const { product, notFound: isNotFound } = await fetchProductBySlugServer(slug);

  if (isNotFound) {
    return buildNoIndexMetadata(
      "Product Not Found",
      `This product is no longer available on ${SITE_NAME}.`
    );
  }

  if (!product) {
    const fallbackTitle = humanizeSlug(slug) || "Product Details";
    return buildPublicMetadata({
      title: fallbackTitle,
      description: `Shop ${fallbackTitle} online at ${SITE_NAME} with transparent pricing and secure checkout.`,
      path: `/shop-details/${encodeURIComponent(slug)}`,
    });
  }

  const imageUrls = extractProductImageUrls(product);
  const priceText = `₹${product.price}`;
  const description = truncateDescription(
    product.description ||
      `Buy ${product.title} online at ${SITE_NAME} for ${priceText}. Check real-time stock, ratings, and order securely.`,
    155
  );

  return buildPublicMetadata({
    title: product.title,
    description,
    path: `/shop-details/${encodeURIComponent(product.slug)}`,
    images: imageUrls.map((url) => ({ url, alt: product.title })),
    keywords: [
      product.title,
      SITE_NAME,
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
  const resolvedParams = await params;
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
          <JsonLd data={buildProductJsonLd(product, initialReviews)} />
          <JsonLd
            data={buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              {
                name: product.title,
                path: `/shop-details/${encodeURIComponent(product.slug)}`,
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
