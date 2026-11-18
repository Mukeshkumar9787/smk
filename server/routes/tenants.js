import express from "express";
import tenantController from "../controllers/tenants.js";
import { getAuthMiddleware, requirePlatformAdmin } from "../middlewares/authMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";

const router = express.Router();

// Public multi-tenant resolution & SaaS onboarding endpoints
router.get("/resolve", tenantController.resolveCurrentTenant);
router.get("/plans", tenantController.listPlans);
router.get("/check-slug/:slug", tenantController.checkSlug);
router.post("/provision", tenantController.provision);

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
