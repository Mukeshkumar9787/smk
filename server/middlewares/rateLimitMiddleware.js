import rateLimit, { ipKeyGenerator } from "express-rate-limit";

function getTenantAwareKey(req) {
  const clientIp = ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown");
  const tenantSlug =
    String(req.headers["x-tenant-slug"] || req.query?.tenant || "default")
      .trim()
      .toLowerCase();
  return `${clientIp}:${tenantSlug}`;
}

/**
 * Global Rate Limiter across API routes.
 * - Skips lightweight health & tenant resolution lookups used by SSR/edge routing.
 * - Scopes buckets per (client IP + tenant) so multi-tenant storefronts don't starve each other.
 * - Generous limit for read-only GETs (1500/15min), tighter for mutations (300/15min).
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.method === "GET" || req.method === "HEAD" ? 1500 : 300),
  keyGenerator: getTenantAwareKey,
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/tenants/resolve" ||
    req.path === "/tenants/plans",
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "You're sending requests a bit too fast. Please wait a moment before trying again.",
  },
});

/**
 * Strict Rate Limiter for Authentication and OTP endpoints.
 * 10 requests per 15 minutes per IP+tenant to prevent credential brute-forcing and OTP exhaustion.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: getTenantAwareKey,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please wait 15 minutes before trying again.",
  },
});

/**
 * Order & Checkout Rate Limiter.
 * 20 order creation attempts per 15 minutes per IP+tenant.
 */
export const ordersRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: getTenantAwareKey,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "Too many checkout attempts. Please wait a few minutes before trying again.",
  },
});
