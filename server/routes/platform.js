import express from "express";
import tenantController from "../controllers/tenants.js";
import { requirePlatformAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public platform onboarding endpoints
router.get("/plans", tenantController.listPlans);
router.get("/check-slug/:slug", tenantController.checkSlug);
router.post("/provision", tenantController.provision);

// Protected Super Admin Platform management endpoints
router.use(requirePlatformAdmin);
router.get("/overview", tenantController.getPlatformOverview);
router.post("/create", tenantController.createPlatformTenant);
router.patch("/:tenantId/status", tenantController.updateTenantStatus);
router.patch("/:tenantId/plan", tenantController.updateTenantPlan);

export default router;
