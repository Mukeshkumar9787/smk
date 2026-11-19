import jwt from "jsonwebtoken";
import userService from "../services/users.js";
import { ROLE_TYPES, TENANT_ROLES } from "../utils/constants.js";
import { DEFAULT_TENANT_ID, getCurrentTenantId } from "../utils/tenantContext.js";
import { rawPrisma } from "../prisma/client.js";

const PLATFORM_ADMIN_EMAILS = new Set(
  (process.env.PLATFORM_ADMIN_EMAILS || "mukeshkumar87086@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isSuperAdminUser(user) {
  if (!user) return false;
  if (user.isPlatformAdmin !== undefined) {
    return Boolean(user.isPlatformAdmin);
  }
  const email = String(user.email || "").trim().toLowerCase();
  return Boolean(email && PLATFORM_ADMIN_EMAILS.has(email));
}

export const getAuthMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Decoupled Platform Super Admin authentication directly via PlatformAdmin table
      if (decoded.isPlatformAdmin && decoded.email) {
        const platformAdmin = await rawPrisma.platformAdmin.findUnique({
          where: { email: String(decoded.email).trim().toLowerCase() },
        });

        if (platformAdmin) {
          req.user = {
            id: platformAdmin.id,
            email: platformAdmin.email,
            name: platformAdmin.name,
            isPlatformAdmin: true,
            tenantRole: "PLATFORM_ADMIN",
            role: ROLE_TYPES.ADMIN,
          };

          if (allowedRoles.length === 0 || allowedRoles.includes(ROLE_TYPES.ADMIN)) {
            next();
            return;
          }
          return res.status(403).json({ message: "Forbidden: Insufficient platform permissions" });
        }
      }

      const tenantId = req.tenant?.id || getCurrentTenantId();
      if (decoded.tenantId && tenantId && decoded.tenantId !== tenantId) {
        return res.status(401).json({ message: "Unauthorized: Session belongs to a different store" });
      }

      const user = await userService.getUserInfo(decoded);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: Account not found in this store" });
      }
      if (tenantId && user.tenantId && user.tenantId !== tenantId) {
        return res.status(401).json({ message: "Unauthorized: Account belongs to a different store" });
      }

      const superAdmin = isSuperAdminUser(user);
      const isTenantAdmin =
        superAdmin ||
        user.tenantRole === TENANT_ROLES.STORE_OWNER ||
        user.tenantRole === TENANT_ROLES.STORE_STAFF ||
        user.role === ROLE_TYPES.ADMIN;

      // Effective role scoped strictly to the current tenant
      const effectiveRole = isTenantAdmin ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER;

      req.user = {
        ...user,
        isPlatformAdmin: superAdmin,
        tenantRole: superAdmin
          ? "PLATFORM_ADMIN"
          : user.tenantRole || TENANT_ROLES.CUSTOMER,
        role: effectiveRole,
      };

      if (allowedRoles.length === 0 || allowedRoles.includes(req.user.role)) {
        next();
        return;
      }

      return res.status(403).json({ message: "Forbidden: Insufficient store permissions" });
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
  };
};

export const requirePlatformAdmin = async (req, res, next) => {
  return getAuthMiddleware()(req, res, () => {
    if (!req.user?.isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Platform Super Admin access required",
      });
    }
    next();
  });
};
