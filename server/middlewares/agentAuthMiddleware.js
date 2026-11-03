import crypto from "crypto";
import jwt from "jsonwebtoken";
import userService from "../services/users.js";
import { ROLE_TYPES } from "../utils/constants.js";

/**
 * Timing-safe string comparison to prevent timing attacks on API keys.
 */
const safeKeyCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Middleware to authenticate autonomous inventory agents via an API key
 * configured in environment variables (INVENTORY_AGENT_API_KEY), or admin users
 * via a valid JWT token. Blocks all unauthenticated callers.
 */
export const agentAuthMiddleware = async (req, res, next) => {
  const configuredApiKey =
    process.env.INVENTORY_AGENT_API_KEY ||
    process.env.AGENT_API_KEY ||
    process.env.RESTOCK_API_KEY;

  const apiKeyHeader = req.headers["x-api-key"];
  const authHeader = req.headers.authorization;
  let bearerToken = null;

  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    } else if (authHeader.startsWith("ApiKey ")) {
      bearerToken = authHeader.slice(7).trim();
    }
  }

  // 1. Verify against configured Agent API Key
  if (configuredApiKey) {
    if (
      (apiKeyHeader && safeKeyCompare(apiKeyHeader, configuredApiKey)) ||
      (bearerToken && safeKeyCompare(bearerToken, configuredApiKey))
    ) {
      req.isAgent = true;
      req.agent = { name: "InventoryAgent" };
      return next();
    }
  }

  // 2. Fallback: Verify Admin JWT token (allows store admins to call restock endpoint)
  if (bearerToken && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
      const user = await userService.getUserInfo(decoded);
      if (user && user.role === ROLE_TYPES.ADMIN) {
        req.user = user;
        return next();
      }
    } catch {
      // JWT invalid or expired; proceed to 401
    }
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized: Invalid or missing Agent API key",
  });
};

export default agentAuthMiddleware;
