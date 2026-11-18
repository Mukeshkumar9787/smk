import { NextRequest, NextResponse } from "next/server";

const TENANT_COOKIE = "smk_tenant_slug";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();

  // Handle explicit ?tenant=<slug> switcher (e.g. ?tenant=smk to return to default store)
  const queryTenant = searchParams.get("tenant")?.trim().toLowerCase();
  if (queryTenant) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("tenant");
    const response = NextResponse.redirect(cleanUrl);
    if (queryTenant === "default" || queryTenant === "smk") {
      response.cookies.delete(TENANT_COOKIE);
    } else {
      response.cookies.set(TENANT_COOKIE, queryTenant, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  // Handle path-based tenant storefront URLs: /s/<slug> and /s/<slug>/<subpath>
  const storeMatch = pathname.match(/^\/s\/([a-z0-9-]+)(\/.*)?$/i);
  if (storeMatch) {
    const slug = storeMatch[1].toLowerCase();
    const restPath = storeMatch[2] || "/";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = restPath;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", slug);
    if (host) requestHeaders.set("x-tenant-host", host);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(TENANT_COOKIE, slug, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  // Propagate host + active cookie tenant slug to Server Components
  const requestHeaders = new Headers(request.headers);
  if (host) requestHeaders.set("x-tenant-host", host);

  const cookieSlug = request.cookies.get(TENANT_COOKIE)?.value;
  if (cookieSlug && !requestHeaders.get("x-tenant-slug")) {
    requestHeaders.set("x-tenant-slug", cookieSlug);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
