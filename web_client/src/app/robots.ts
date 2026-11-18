import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/platform-admin",
          "/launch",
          "/audit-logs",
          "/users",
          "/config",
          "/product",
          "/category",
          "/hsn",
          "/size",
          "/color",
          "/cart",
          "/checkout",
          "/orders",
          "/my-account",
          "/wishlist",
          "/signin",
          "/signup",
          "/signin-otp",
          "/reset-password",
          "/mail-success",
          "/error",
          "/shop-without-sidebar",
          "/blogs",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
