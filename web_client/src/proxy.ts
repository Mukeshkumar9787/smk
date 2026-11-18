import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();

  // Path-based isolated storefront URLs: /s/<slug> and /s/<slug>/<subpath>
  // Purely URL-driven so multiple stores open in separate tabs never collide.
  const storeMatch = pathname.match(/^\/s\/([a-z0-9-]+)(\/.*)?$/i);
  if (storeMatch) {
    const slug = storeMatch[1].toLowerCase();
    const restPath = storeMatch[2] || "/";
    const rewriteUrl = request.nextUrl.clone();

    // Platform-only pages are hidden inside individual tenant storefronts
    const isPlatformOnlyRoute =
      restPath === "/launch" ||
      restPath.startsWith("/launch/") ||
      restPath === "/platform-admin" ||
      restPath.startsWith("/platform-admin/");

    rewriteUrl.pathname = isPlatformOnlyRoute ? "/404" : restPath;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", slug);
    requestHeaders.set("x-tenant-base-path", `/s/${slug}`);
    if (host) requestHeaders.set("x-tenant-host", host);

    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  // Host-based routing (wildcard subdomain, custom domain, or default SMK root)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-base-path", "");
  if (host) requestHeaders.set("x-tenant-host", host);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
