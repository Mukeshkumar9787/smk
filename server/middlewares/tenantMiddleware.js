import { rawPrisma } from "../prisma/client.js";
import {
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_SLUG,
  runWithTenant,
} from "../utils/tenantContext.js";

const TENANT_CACHE_TTL_MS = 15_000;
const tenantCache = new Map();

export function clearTenantCache(slugOrHost = null) {
  if (!slugOrHost) {
    tenantCache.clear();
    return;
  }
  tenantCache.delete(String(slugOrHost).toLowerCase());
}

function getCached(key) {
  const entry = tenantCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tenantCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  tenantCache.set(key, { value, expiresAt: Date.now() + TENANT_CACHE_TTL_MS });
}

function normalizeHost(rawHost = "") {
  return String(rawHost)
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function extractSubdomainSlug(host) {
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Local dev subdomain e.g. brand.localhost
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return sub && sub !== "www" && sub !== "app" ? sub : null;
  }

  // Custom root platform domain e.g. PLATFORM_ROOT_DOMAIN=smkcommerce.in
  const rootDomain = (process.env.PLATFORM_ROOT_DOMAIN || "").trim().toLowerCase();
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, -(rootDomain.length + 1));
    if (sub && !sub.includes(".") && sub !== "www" && sub !== "app" && sub !== "api") {
      return sub;
    }
  }

  return null;
}

const TENANT_INCLUDE = {
  branding: true,
  plan: true,
};

export async function resolveTenant({ slug = null, host = null } = {}) {
  const cleanSlug = slug ? String(slug).trim().toLowerCase() : null;
  const cleanHost = normalizeHost(host);
  const cacheKey = cleanSlug ? `slug:${cleanSlug}` : `host:${cleanHost || "default"}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  let tenant = null;

  // 1. Explicit tenant slug (header X-Tenant-Slug or ?tenant=slug or /s/:slug)
  if (cleanSlug) {
    tenant = await rawPrisma.tenant.findUnique({
      where: { slug: cleanSlug },
      include: TENANT_INCLUDE,
    });
    if (tenant) {
      setCached(cacheKey, tenant);
      return tenant;
    }
    return null;
  }

  // 2. Match verified custom domain
  if (cleanHost) {
    tenant = await rawPrisma.tenant.findFirst({
      where: {
        customDomain: cleanHost,
        customDomainVerified: true,
      },
      include: TENANT_INCLUDE,
    });
    if (tenant) {
      setCached(cacheKey, tenant);
      return tenant;
    }

    // 3. Match wildcard subdomain under PLATFORM_ROOT_DOMAIN or *.localhost
    const subSlug = extractSubdomainSlug(cleanHost);
    if (subSlug) {
      tenant = await rawPrisma.tenant.findUnique({
        where: { slug: subSlug },
        include: TENANT_INCLUDE,
      });
      if (tenant) {
        setCached(cacheKey, tenant);
        return tenant;
      }
      return null;
    }
  }

  // 4. Fallback to default SMK tenant (root / vercel.app / localhost)
  tenant = await rawPrisma.tenant.findFirst({
    where: {
      OR: [{ isDefault: true }, { id: DEFAULT_TENANT_ID }, { slug: DEFAULT_TENANT_SLUG }],
    },
    include: TENANT_INCLUDE,
    orderBy: { isDefault: "desc" },
  });

  if (tenant) {
    setCached(cacheKey, tenant);
  }
  return tenant;
}

export const tenantMiddleware = async (req, res, next) => {
  try {
    const headerSlug = req.headers["x-tenant-slug"] || req.query?.tenant || null;
    const headerHost =
      req.headers["x-tenant-host"] ||
      req.headers["x-forwarded-host"] ||
      req.headers.origin ||
      "";

    const tenant = await resolveTenant({
      slug: headerSlug ? String(headerSlug) : null,
      host: String(headerHost),
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Allow platform-level routes even if current host tenant is suspended
    const isPlatformRoute = req.path.startsWith("/tenants/platform") || req.path.startsWith("/tenants/plans") || req.path.startsWith("/tenants/provision") || req.path.startsWith("/tenants/check-slug");
    if (!isPlatformRoute && (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED")) {
      return res.status(403).json({
        success: false,
        message: "This store is currently unavailable.",
        code: "TENANT_SUSPENDED",
      });
    }

    req.tenant = tenant;
    return runWithTenant(tenant, () => next());
  } catch (err) {
    console.error("[tenantMiddleware] Failed to resolve tenant:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve store context",
    });
  }
};
