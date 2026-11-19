import express from "express";
import tenantController from "../controllers/tenants.js";
import { requirePlatformAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public platform onboarding and administrative auth endpoints
router.get("/plans", tenantController.listPlans);
router.get("/check-slug/:slug", tenantController.checkSlug);
router.post("/provision", tenantController.provision);
router.post("/auth/login", tenantController.platformLogin);
router.post("/login", tenantController.platformLogin);

// Protected Super Admin Platform management endpoints
router.use(requirePlatformAdmin);
router.get("/me", tenantController.getPlatformMe);
router.get("/overview", tenantController.getPlatformOverview);
router.post("/create", tenantController.createPlatformTenant);
router.patch("/:tenantId/status", tenantController.updateTenantStatus);
router.patch("/:tenantId/chatbot", tenantController.updateTenantChatbotAccess);
router.patch("/:tenantId/plan", tenantController.updateTenantPlan);

export default router;
