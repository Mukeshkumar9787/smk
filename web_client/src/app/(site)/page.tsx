import Home from "@/components/Home";
import JsonLd from "@/components/Common/JsonLd";
import {
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
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildPublicMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  title: {
    absolute: SITE_TITLE,
  },
};

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
