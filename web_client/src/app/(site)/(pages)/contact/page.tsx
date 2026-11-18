import Contact from "@/components/Contact";
import JsonLd from "@/components/Common/JsonLd";
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPublicMetadata,
} from "@/lib/seo";
import { fetchCompanyInfoServer } from "@/lib/seoServer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicMetadata({
  title: "Contact Us",
  description: `Get in touch with the ${SITE_NAME} team for order support, product inquiries, collaborations, or wholesale requests.`,
  path: "/contact",
  keywords: [`${SITE_NAME} contact`, `${SITE_NAME} customer support`, "order support"],
});

const ContactPage = async () => {
  const initialCompInfo = await fetchCompanyInfoServer(600);

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: absoluteUrl("/contact"),
    description: `Customer support and contact details for ${SITE_NAME}.`,
  };

  return (
    <>
      <JsonLd data={contactPageSchema} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Contact initialCompInfo={initialCompInfo} />
    </>
  );
};

export default ContactPage;
