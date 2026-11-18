import express from "express";
import tenantController from "../controllers/tenants.js";
import { getAuthMiddleware, requirePlatformAdmin } from "../middlewares/authMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";

const router = express.Router();

// Public multi-tenant resolution endpoint
router.get("/resolve", tenantController.resolveCurrentTenant);

// Platform Super Admin store creation & provisioning endpoints
router.get("/plans", requirePlatformAdmin, tenantController.listPlans);
router.get("/check-slug/:slug", requirePlatformAdmin, tenantController.checkSlug);
router.post("/provision", requirePlatformAdmin, tenantController.provision);

// Current store owner / admin endpoints
router.get(
  "/current/branding",
  getAuthMiddleware([ROLE_TYPES.ADMIN]),
  tenantController.getCurrentBranding
);
router.put(
  "/current/branding",
  getAuthMiddleware([ROLE_TYPES.ADMIN]),
  tenantController.updateCurrentBranding
);
router.get(
  "/current/subscription",
  getAuthMiddleware([ROLE_TYPES.ADMIN]),
  tenantController.getCurrentSubscription
);

// Platform Super Admin endpoints (mukeshkumar87086@gmail.com)
router.get(
  "/platform/overview",
  requirePlatformAdmin,
  tenantController.getPlatformOverview
);
router.post(
  "/platform/create",
  requirePlatformAdmin,
  tenantController.createPlatformTenant
);
router.patch(
  "/platform/:tenantId/status",
  requirePlatformAdmin,
  tenantController.updateTenantStatus
);

export default router;
