import prisma from "../prisma/client.js";
import { ROLE_TYPES } from "../utils/constants.js";
import { DEFAULT_TENANT_ID } from "../utils/tenantContext.js";

const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "otp",
  "accessToken",
  "refreshToken",
  "idToken",
]);

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const truncateValue = (value) => {
  if (typeof value === "string" && value.length > 300) {
    return `${value.slice(0, 300)}...`;
  }

  return value;
};

const sanitizePayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.slice(0, 20).map(sanitizePayload);
  }

  if (payload && typeof payload === "object") {
    return Object.entries(payload).reduce((acc, [key, value]) => {
      if (SENSITIVE_KEYS.has(key)) {
        acc[key] = "[REDACTED]";
        return acc;
      }

      acc[key] = sanitizePayload(value);
      return acc;
    }, {});
  }

  return truncateValue(payload);
};

const ENTITY_LABELS = {
  auth: "authentication",
  products: "product",
  categories: "category",
  sizes: "size",
  colors: "color",
  users: "user",
  orders: "order",
  files: "file",
  hsn: "hsn",
  config: "config",
  dashboard: "dashboard",
  address: "address",
  cart: "cart",
  wishlist: "wishlist",
};

const CONFIG_LABELS = {
  SHIPPING: "shipping_info",
  COMP_INFO: "company_info",
  COURIER: "courier",
};

const getEntityFromPath = (path) => {
  const [entity = "system"] = path.split("/").filter(Boolean);
  return entity;
};

const getConfigLabel = (req) => {
  const configKeys = Object.keys(req.body?.config || {});
  if (configKeys.length === 1) {
    return CONFIG_LABELS[configKeys[0]] || "config";
  }

  return "config";
};

const getEntityLabel = (req) => {
  const entityKey = getEntityFromPath(req.baseUrl || req.path);
  if (entityKey === "config") {
    return getConfigLabel(req);
  }

  return (ENTITY_LABELS[entityKey] || entityKey.replace(/-/g, " ")).toLowerCase();
};

const getEntityId = (req) => {
  return (
    req.params?.id ||
    req.params?.slug ||
    req.body?.id ||
    req.body?.userId ||
    req.body?.orderId ||
    req.query?.id ||
    null
  );
};

const getAction = (req, entityLabel) => {
  const methodActionMap = {
    POST: "created",
    PUT: "updated",
    PATCH: "updated",
    DELETE: "deleted",
  };

  const path = req.path.toLowerCase();
  if (path.includes("/status/")) return `${entityLabel}_status_updated`;
  if (path.includes("/role")) return `${entityLabel}_role_updated`;
  if (path.includes("/verify")) return `${entityLabel}_verified`;

  return `${entityLabel}_${methodActionMap[req.method] || "updated"}`;
};

export const auditLogMiddleware = (req, res, next) => {
  if (!AUDITED_METHODS.has(req.method)) {
    next();
    return;
  }

  res.on("finish", async () => {
    if (res.statusCode >= 400) return;
    if (!req.user || req.user.role !== ROLE_TYPES.ADMIN) return;
    if (req.path.startsWith("/audit-logs")) return;

    const entity = getEntityLabel(req);

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenant?.id || DEFAULT_TENANT_ID,
          userId: req.user.id,
          action: getAction(req, entity),
          entity,
          entityId: getEntityId(req)?.toString() || null,
          method: req.method,
          route: req.originalUrl,
          statusCode: res.statusCode,
          ipAddress: req.ip,
          userAgent: req.get("user-agent") || null,
          meta: sanitizePayload({
            params: req.params,
            query: req.query,
            body: sanitizePayload(req.body),
            response: safeJsonParse(res.locals.auditLogMeta),
          }),
        },
      });
    } catch (error) {
      console.error("Audit log write failed:", error.message);
    }
  });

  next();
};
