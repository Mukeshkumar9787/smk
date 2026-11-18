import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_TENANT, type PublicTenant } from "./theme";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

export const TENANT_COOKIE_NAME = "smk_tenant_slug";

const TENANT_MEMORY_CACHE_TTL_MS = 60_000;
const tenantMemoryCache = new Map<string, { value: PublicTenant; expiresAt: number }>();

export const getServerTenantHeaders = cache(async (): Promise<Record<string, string>> => {
  const out: Record<string, string> = {};
  try {
    const hdrs = await headers();
    const cookieStore = await cookies();
    const slugFromHeader = hdrs.get("x-tenant-slug");
    const slugFromCookie = cookieStore.get(TENANT_COOKIE_NAME)?.value;
    const host =
      hdrs.get("x-tenant-host") ||
      hdrs.get("x-forwarded-host") ||
      hdrs.get("host") ||
      "";

    const slug = slugFromHeader || slugFromCookie;
    if (slug) {
      out["x-tenant-slug"] = slug;
    }
    if (host) {
      out["x-tenant-host"] = host;
    }
  } catch {
    // Called outside request scope (e.g. build-time static generation)
  }
  return out;
});

export const fetchCurrentTenantServer = cache(async (): Promise<PublicTenant> => {
  const tenantHeaders = await getServerTenantHeaders();
  const cacheKey = tenantHeaders["x-tenant-slug"]
    ? `slug:${tenantHeaders["x-tenant-slug"]}`
    : `host:${tenantHeaders["x-tenant-host"] || "default"}`;

  const cached = tenantMemoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  try {
    const querySuffix = tenantHeaders["x-tenant-slug"]
      ? `?tenant=${encodeURIComponent(tenantHeaders["x-tenant-slug"])}`
      : "";
    const res = await fetch(`${API_BASE_URL}/tenants/resolve${querySuffix}`, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
        ...tenantHeaders,
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return cached?.value || DEFAULT_TENANT;
    const payload = await res.json().catch(() => null);
    if (!payload?.success || !payload?.data) return cached?.value || DEFAULT_TENANT;

    const resolved = payload.data as PublicTenant;
    tenantMemoryCache.set(cacheKey, {
      value: resolved,
      expiresAt: Date.now() + TENANT_MEMORY_CACHE_TTL_MS,
    });
    return resolved;
  } catch {
    return cached?.value || DEFAULT_TENANT;
  }
});
