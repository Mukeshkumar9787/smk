import jwt from "jsonwebtoken";
import { rawPrisma } from "../prisma/client.js";
import userService from "../services/users.js";
import { ROLE_TYPES, TENANT_ROLES } from "../utils/constants.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";

const PLATFORM_ADMIN_EMAILS = new Set(
  (process.env.PLATFORM_ADMIN_EMAILS || "mukeshkumar87086@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isSuperAdminUser(user) {
  if (!user) return false;
  return Boolean(
    user.isPlatformAdmin ||
      (user.email && PLATFORM_ADMIN_EMAILS.has(String(user.email).toLowerCase()))
  );
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

      const user = await userService.getUserInfo(decoded);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tenantId = req.tenant?.id || getCurrentTenantId();
      const membership = tenantId
        ? await rawPrisma.tenantMembership.findUnique({
            where: {
              tenantId_userId: {
                tenantId,
                userId: user.id,
              },
            },
          })
        : null;

      const superAdmin = isSuperAdminUser(user);
      const isTenantAdmin =
        superAdmin ||
        membership?.role === TENANT_ROLES.STORE_OWNER ||
        membership?.role === TENANT_ROLES.STORE_STAFF;

      // Effective role scoped strictly to the current tenant
      const effectiveRole = isTenantAdmin ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER;

      req.user = {
        ...user,
        isPlatformAdmin: superAdmin,
        tenantRole: superAdmin
          ? "PLATFORM_ADMIN"
          : membership?.role || TENANT_ROLES.CUSTOMER,
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
