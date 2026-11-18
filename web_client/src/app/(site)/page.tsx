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
import { fetchCurrentTenantServer } from "@/lib/tenantServer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await fetchCurrentTenantServer();
  const storeName = tenant?.branding?.storeName || "SMK";
  const title = tenant?.branding?.seoTitle || `${storeName} | Online Shopping Store`;
  const description = tenant?.branding?.seoDescription || SITE_DESCRIPTION;
  const logoUrl = tenant?.branding?.logoUrl || DEFAULT_OG_IMAGE;
  const path = tenant?.isDefault ? "/" : `/s/${encodeURIComponent(tenant.slug)}`;

  return {
    ...buildPublicMetadata({
      title,
      description,
      path,
      images: [{ url: logoUrl, alt: storeName }],
    }),
    title: {
      absolute: title || SITE_TITLE,
    },
  };
}

export default async function HomePage() {
  const [compInfo, initialCategories] = await Promise.all([
    fetchCompanyInfoServer(600),
    fetchActiveCategoriesServer(false, 300),
  ]);

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd(compInfo)} />
      <JsonLd data={buildWebsiteJsonLd()} />
      <Home initialCategories={initialCategories} />
    </>
  );
}
