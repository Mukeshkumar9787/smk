import { cookies, headers } from "next/headers";
import { DEFAULT_TENANT, type PublicTenant } from "./theme";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

export const TENANT_COOKIE_NAME = "smk_tenant_slug";

export async function getServerTenantHeaders(): Promise<Record<string, string>> {
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
}

export async function fetchCurrentTenantServer(): Promise<PublicTenant> {
  const tenantHeaders = await getServerTenantHeaders();
  try {
    const res = await fetch(`${API_BASE_URL}/tenants/resolve`, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
        ...tenantHeaders,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return DEFAULT_TENANT;
    const payload = await res.json().catch(() => null);
    if (!payload?.success || !payload?.data) return DEFAULT_TENANT;
    return payload.data as PublicTenant;
  } catch {
    return DEFAULT_TENANT;
  }
}
