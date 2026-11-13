import rateLimit from "express-rate-limit";

/**
 * Standard Global Rate Limiter across all API routes.
 * 300 requests per 15 minutes per IP.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "You're sending requests a bit too fast. Please wait a moment before trying again.",
  },
});

/**
 * Strict Rate Limiter for Authentication and OTP endpoints.
 * 10 requests per 15 minutes per IP to prevent credential brute-forcing and OTP exhaustion.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please wait 15 minutes before trying again.",
  },
});

/**
 * Order & Checkout Rate Limiter.
 * 20 order creation attempts per 15 minutes per IP.
 */
export const ordersRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: "Too many checkout attempts. Please wait a few minutes before trying again.",
  },
});

