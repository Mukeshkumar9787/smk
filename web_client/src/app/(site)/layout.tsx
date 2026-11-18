import type { Metadata, Viewport } from "next";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import "react-image-crop/dist/ReactCrop.css";
import SiteShell from "@/components/SiteShell";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
import { fetchCurrentTenantServer } from "@/lib/tenantServer";
import { buildThemeCssVariables } from "@/lib/theme";

export async function generateViewport(): Promise<Viewport> {
  const tenant = await fetchCurrentTenantServer();
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: tenant?.branding?.primaryColor || "#0ea5e9",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await fetchCurrentTenantServer();
  const storeName = tenant?.branding?.storeName || SITE_NAME;
  const defaultTitle = tenant?.branding?.seoTitle || `${storeName} | Online Shopping Store`;
  const description = tenant?.branding?.seoDescription || SITE_DESCRIPTION;
  const ogImage = tenant?.branding?.logoUrl || DEFAULT_OG_IMAGE;
  const favicon = tenant?.branding?.faviconUrl || "/favicon.ico";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle || SITE_TITLE,
      template: `%s | ${storeName}`,
    },
    description,
    applicationName: storeName,
    keywords: [
      storeName,
      `${storeName} store`,
      "online shopping",
      "new arrivals",
      "curated collections",
    ],
    authors: [{ name: storeName, url: SITE_URL }],
    creator: storeName,
    publisher: storeName,
    alternates: {
      canonical: SITE_URL,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: storeName,
      title: defaultTitle,
      description,
      images: [
        {
          url: absoluteUrl(ogImage),
          alt: storeName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
      images: [absoluteUrl(ogImage)],
    },
    icons: {
      icon: favicon,
      apple: ogImage,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await fetchCurrentTenantServer();
  const themeVars = buildThemeCssVariables(tenant?.branding);

  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      style={themeVars as React.CSSProperties}
    >
      <body
        className="pb-[calc(6rem+env(safe-area-inset-bottom))] text-dark xl:pb-0"
        style={{
          background: `radial-gradient(circle at top right, rgba(${themeVars["--brand-accent"].replace(/ /g, ",")}, 0.12), transparent 24%), linear-gradient(180deg, #ffffff 0%, ${tenant?.branding?.backgroundColor || "#f6faff"} 100%)`,
        }}
      >
        <SiteShell initialTenant={tenant}>{children}</SiteShell>
      </body>
    </html>
  );
}
