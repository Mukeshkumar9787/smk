import { cache } from "react";
import { headers } from "next/headers";
import { DEFAULT_TENANT, type PublicTenant } from "./theme";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

export type TenantResolutionError = "TENANT_SUSPENDED" | "TENANT_NOT_FOUND" | null;

export interface TenantResolutionResult {
  tenant: PublicTenant;
  errorCode: TenantResolutionError;
}

const TENANT_MEMORY_CACHE_TTL_MS = 60_000;
const tenantMemoryCache = new Map<string, { value: TenantResolutionResult; expiresAt: number }>();

export const getServerTenantBasePath = cache(async (): Promise<string> => {
  try {
    const hdrs = await headers();
    return hdrs.get("x-tenant-base-path") || "";
  } catch {
    return "";
  }
});

export const getServerTenantHeaders = cache(async (): Promise<Record<string, string>> => {
  const out: Record<string, string> = {};
  try {
    const hdrs = await headers();
    const slug = hdrs.get("x-tenant-slug");
    const host =
      hdrs.get("x-tenant-host") ||
      hdrs.get("x-forwarded-host") ||
      hdrs.get("host") ||
      "";

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

export const fetchTenantResolutionServer = cache(
  async (): Promise<TenantResolutionResult> => {
    const tenantHeaders = await getServerTenantHeaders();
    const explicitSlug = tenantHeaders["x-tenant-slug"] || "";
    const cacheKey = explicitSlug
      ? `slug:${explicitSlug}`
      : `host:${tenantHeaders["x-tenant-host"] || "default"}`;

    const cached = tenantMemoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const querySuffix = explicitSlug
        ? `?tenant=${encodeURIComponent(explicitSlug)}`
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

      const payload = await res.json().catch(() => null);

      if (res.status === 403 && payload?.code === "TENANT_SUSPENDED") {
        const result: TenantResolutionResult = {
          tenant: DEFAULT_TENANT,
          errorCode: "TENANT_SUSPENDED",
        };
        // Short TTL (10s) so re-activating a store takes effect almost immediately
        tenantMemoryCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + 10_000,
        });
        return result;
      }

      if (res.status === 404 && (payload?.code === "TENANT_NOT_FOUND" || explicitSlug)) {
        const result: TenantResolutionResult = {
          tenant: DEFAULT_TENANT,
          errorCode: "TENANT_NOT_FOUND",
        };
        tenantMemoryCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + 10_000,
        });
        return result;
      }

      if (!res.ok || !payload?.success || !payload?.data) {
        return cached?.value || { tenant: DEFAULT_TENANT, errorCode: null };
      }

      const resolved: TenantResolutionResult = {
        tenant: payload.data as PublicTenant,
        errorCode: null,
      };
      tenantMemoryCache.set(cacheKey, {
        value: resolved,
        expiresAt: Date.now() + TENANT_MEMORY_CACHE_TTL_MS,
      });
      return resolved;
    } catch {
      return cached?.value || { tenant: DEFAULT_TENANT, errorCode: null };
    }
  }
);

export const fetchCurrentTenantServer = cache(async (): Promise<PublicTenant> => {
  const { tenant } = await fetchTenantResolutionServer();
  return tenant;
});
