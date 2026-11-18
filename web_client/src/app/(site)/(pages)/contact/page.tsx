import Contact from "@/components/Contact";
import JsonLd from "@/components/Common/JsonLd";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPublicMetadata,
} from "@/lib/seo";
import { fetchCompanyInfoServer } from "@/lib/seoServer";
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

  return buildPublicMetadata({
    title: "Contact Us",
    description: `Get in touch with the ${storeName} team for order support, product inquiries, collaborations, or wholesale requests.`,
    path: `${basePath}/contact`,
    siteName: storeName,
    images: tenant?.branding?.logoUrl
      ? [{ url: tenant.branding.logoUrl, alt: storeName }]
      : undefined,
    keywords: [`${storeName} contact`, `${storeName} customer support`, "order support"],
  });
}

const ContactPage = async () => {
  const [tenant, basePath, initialCompInfo] = await Promise.all([
    fetchCurrentTenantServer(),
    getServerTenantBasePath(),
    fetchCompanyInfoServer(600),
  ]);
  const storeName = tenant?.branding?.storeName || "SMK";

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${storeName}`,
    url: absoluteUrl(`${basePath}/contact`),
    description: `Customer support and contact details for ${storeName}.`,
  };

  return (
    <>
      <JsonLd data={contactPageSchema} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: basePath || "/" },
          { name: "Contact", path: `${basePath}/contact` },
        ])}
      />
      <Contact initialCompInfo={initialCompInfo} />
    </>
  );
};

export default ContactPage;
