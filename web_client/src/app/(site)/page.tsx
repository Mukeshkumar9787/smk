import Home from "@/components/Home";
import JsonLd from "@/components/Common/JsonLd";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  buildOrganizationJsonLd,
  buildPublicMetadata,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import {
  fetchActiveCategoriesServer,
  fetchCompanyInfoServer,
} from "@/lib/seoServer";
import {
  fetchCurrentTenantServer,
  fetchTenantResolutionServer,
  getServerTenantBasePath,
} from "@/lib/tenantServer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ tenant, errorCode }, basePath] = await Promise.all([
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
  const title = tenant?.branding?.seoTitle || `${storeName} | Online Shopping Store`;
  const description = tenant?.branding?.seoDescription || SITE_DESCRIPTION;
  const logoUrl = tenant?.branding?.logoUrl || DEFAULT_OG_IMAGE;
  const path = basePath || "/";

  return {
    ...buildPublicMetadata({
      title,
      description,
      path,
      siteName: storeName,
      images: [{ url: logoUrl, alt: storeName }],
    }),
    title: {
      absolute: title || SITE_TITLE,
    },
  };
}

export default async function HomePage() {
  const [{ tenant, errorCode }, basePath] = await Promise.all([
    fetchTenantResolutionServer(),
    getServerTenantBasePath(),
  ]);
  if (errorCode) return null;

  const [compInfo, initialCategories] = await Promise.all([
    fetchCompanyInfoServer(600),
    fetchActiveCategoriesServer(false, 300),
  ]);

  const storeName = tenant?.branding?.storeName || "SMK";

  return (
    <>
      <JsonLd
        data={buildOrganizationJsonLd(compInfo, {
          siteName: storeName,
          logoUrl: tenant?.branding?.logoUrl,
          basePath,
          description: tenant?.branding?.seoDescription,
        })}
      />
      <JsonLd
        data={buildWebsiteJsonLd({
          siteName: storeName,
          basePath,
          description: tenant?.branding?.seoDescription,
        })}
      />
      <Home initialCategories={initialCategories} />
    </>
  );
}
