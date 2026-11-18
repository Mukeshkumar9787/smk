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
import {
  fetchCurrentTenantServer,
  fetchTenantResolutionServer,
  getServerTenantBasePath,
} from "@/lib/tenantServer";
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
  const [{ tenant, errorCode }, basePath] = await Promise.all([
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);

  if (errorCode === "TENANT_SUSPENDED") {
    return {
      title: "Store Unavailable",
      description: "This online store is currently unavailable.",
      robots: { index: false, follow: false },
    };
  }

  if (errorCode === "TENANT_NOT_FOUND") {
    return {
      title: "Store Not Found",
      description: "The requested online store could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const storeName = tenant?.branding?.storeName || SITE_NAME;
  const defaultTitle = tenant?.branding?.seoTitle || `${storeName} | Online Shopping Store`;
  const description =
    tenant?.branding?.seoDescription ||
    (tenant?.isDefault
      ? SITE_DESCRIPTION
      : `Shop curated collections, everyday essentials, and new arrivals at ${storeName}.`);
  const ogImage = tenant?.branding?.logoUrl || DEFAULT_OG_IMAGE;
  const favicon = tenant?.branding?.faviconUrl || "/favicon.ico";
  const storeUrl = absoluteUrl(basePath || "/");

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
    authors: [{ name: storeName, url: storeUrl }],
    creator: storeName,
    publisher: storeName,
    alternates: {
      canonical: storeUrl,
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
      url: storeUrl,
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
  const [{ tenant, errorCode }, basePath] = await Promise.all([
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);

  if (errorCode === "TENANT_SUSPENDED" || errorCode === "TENANT_NOT_FOUND") {
    const isSuspended = errorCode === "TENANT_SUSPENDED";
    return (
      <html lang="en" suppressHydrationWarning={true}>
        <body className="min-h-screen bg-slate-50 text-slate-900">
          <main className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                {isSuspended ? "⏸️" : "🔍"}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isSuspended ? "Store Currently Unavailable" : "Store Not Found"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {isSuspended
                  ? "This storefront has been temporarily paused by its administrator. Please check back later."
                  : "The store link you visited does not exist or may have changed."}
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }

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
        <SiteShell initialTenant={tenant} initialBasePath={basePath}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
