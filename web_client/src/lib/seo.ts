import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://smk-tan.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "SMK";
export const SITE_TITLE = "SMK | Online Shopping Store";
export const SITE_DESCRIPTION =
  "Shop curated collections, everyday essentials, and new arrivals at SMK with transparent pricing, real-time stock availability, and secure online checkout.";
export const DEFAULT_OG_IMAGE = "/images/logo/smk.jpg";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function absoluteUrl(path = "/"): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function truncateDescription(text: string | null | undefined, maxLength = 155): string {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return SITE_DESCRIPTION;
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildNoIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: NOINDEX_ROBOTS,
  };
}

interface PublicMetadataOptions {
  title: string;
  description: string;
  path?: string;
  images?: Array<{ url: string; alt?: string; width?: number; height?: number }>;
  keywords?: string[];
  noIndex?: boolean;
}

export function buildPublicMetadata({
  title,
  description,
  path = "/",
  images,
  keywords,
  noIndex = false,
}: PublicMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const ogImages =
    images && images.length > 0
      ? images.map((img) => ({
          url: absoluteUrl(img.url),
          alt: img.alt || title,
          ...(img.width ? { width: img.width } : {}),
          ...(img.height ? { height: img.height } : {}),
        }))
      : [
          {
            url: absoluteUrl(DEFAULT_OG_IMAGE),
            alt: SITE_NAME,
          },
        ];

  const socialTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ogImages.map((img) => img.url),
    },
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildOrganizationJsonLd(compInfo?: {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
} | null) {
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: compInfo?.name || SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    description: SITE_DESCRIPTION,
  };

  if (compInfo?.email || compInfo?.mobile) {
    org.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        ...(compInfo?.mobile ? { telephone: compInfo.mobile } : {}),
        ...(compInfo?.email ? { email: compInfo.email } : {}),
        availableLanguage: ["English"],
      },
    ];
  }

  if (compInfo?.address) {
    org.address = {
      "@type": "PostalAddress",
      streetAddress: compInfo.address,
    };
  }

  return org;
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export interface SeoProductData {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  mrp?: number;
  stock?: number;
  variant?: string | null;
  categoryName?: string | null;
  sizeTitle?: string | null;
  colorCode?: string | null;
  avgRating?: number;
  reviewCount?: number;
  img?: string | null;
  images?: Array<string | { path?: string }>;
}

export interface SeoReviewData {
  id?: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: { name?: string | null } | null;
}

export function extractProductImageUrls(product: SeoProductData): string[] {
  const urls: string[] = [];
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      const path = typeof img === "string" ? img : img?.path;
      if (path) urls.push(absoluteUrl(path));
    }
  }
  if (urls.length === 0 && product.img) {
    urls.push(absoluteUrl(product.img));
  }
  if (urls.length === 0) {
    urls.push(absoluteUrl(DEFAULT_OG_IMAGE));
  }
  return urls;
}

export function buildProductJsonLd(
  product: SeoProductData,
  reviews: SeoReviewData[] = []
) {
  const productUrl = absoluteUrl(`/shop-details/${product.slug}`);
  const images = extractProductImageUrls(product);
  const inStock = Number(product.stock ?? 0) > 0;
  const reviewCount = Number(product.reviewCount ?? reviews.length ?? 0);
  const avgRating = Number(product.avgRating ?? 0);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url: productUrl,
    image: images,
    description: truncateDescription(
      product.description ||
        `Buy ${product.title} online at ${SITE_NAME} for ₹${product.price}.`,
      300
    ),
    sku: product.variant || `SMK-${product.id}`,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(product.categoryName ? { category: product.categoryName } : {}),
    ...(product.sizeTitle ? { size: product.sizeTitle } : {}),
    ...(product.colorCode ? { color: product.colorCode } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: Number(product.price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  if (reviewCount > 0 && avgRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(avgRating.toFixed(1)),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (reviews.length > 0) {
    schema.review = reviews.slice(0, 10).map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: review.user?.name || "Verified Customer",
      },
      ...(review.comment ? { reviewBody: review.comment } : {}),
      ...(review.createdAt ? { datePublished: review.createdAt } : {}),
    }));
  }

  return schema;
}

export function buildCollectionPageJsonLd(
  products: SeoProductData[],
  title: string,
  description: string,
  path: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/shop-details/${product.slug}`),
        name: product.title,
      })),
    },
  };
}
