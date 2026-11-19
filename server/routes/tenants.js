import express from "express";
import tenantController from "../controllers/tenants.js";
import { getAuthMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";

const router = express.Router({ mergeParams: true });

// Public store resolution endpoint for this tenant
router.get("/resolve", tenantController.resolveCurrentTenant);

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

export default router;
