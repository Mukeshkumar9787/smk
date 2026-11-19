import express from "express";
import authRoutes from "./auth.js";
import categoryRoutes from "./categories.js";
import fileRoutes from "./files.js";
import hsnRoutes from "./hsn.js";
import productRoutes from "./products.js";
import sizeRoutes from "./size.js";
import colorRoutes from "./color.js";
import userRoutes from "./users.js";
import orderRoutes from "./orders.js";
import configRoutes from "./config.js";
import addressRoutes from "./address.js";
import cartRoutes from "./cart.js";
import wishlistRoutes from "./wishlist.js";
import dashboardRoutes from "./dashboard.js";
import auditLogRoutes from "./auditLogs.js";
import tenantRoutes from "./tenants.js";
import platformRoutes from "./platform.js";
import tenantController from "../controllers/tenants.js";
import { getAuthMiddleware } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";
import { paginationMiddleware } from "../middlewares/paginationValidationMiddleware.js";
import { auditLogMiddleware } from "../middlewares/auditLogMiddleware.js";

const router = express.Router();

// 1. Static file uploads
router.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static("uploads")
);

// 2. Global Platform Admin routes (Super Admin)
router.use("/platform", paginationMiddleware, auditLogMiddleware, platformRoutes);

// 3. Tenant-scoped routes mounted directly at /:tenantId
const tenantRouter = express.Router({ mergeParams: true });

tenantRouter.use(tenantMiddleware);
tenantRouter.use(paginationMiddleware);
tenantRouter.use(auditLogMiddleware);

// Direct store resolution: GET /api/:tenantId/resolve
tenantRouter.get("/resolve", tenantController.resolveCurrentTenant);

tenantRouter.use("/tenants", tenantRoutes);
tenantRouter.use("/auth", authRoutes);
tenantRouter.use("/products", productRoutes);
tenantRouter.use("/categories", categoryRoutes);
tenantRouter.use("/sizes", sizeRoutes);
tenantRouter.use("/colors", colorRoutes);
tenantRouter.use("/users", getAuthMiddleware(), userRoutes);
tenantRouter.use("/orders", orderRoutes);
tenantRouter.use("/address", getAuthMiddleware(), addressRoutes);
tenantRouter.use("/files", getAuthMiddleware(), fileRoutes);
tenantRouter.use("/cart", cartRoutes);
tenantRouter.use("/wishlist", wishlistRoutes);
tenantRouter.use("/config", configRoutes);

tenantRouter.use(getAuthMiddleware([ROLE_TYPES.ADMIN]));
tenantRouter.use("/dashboard", dashboardRoutes);
tenantRouter.use("/audit-logs", auditLogRoutes);
tenantRouter.use("/hsn", hsnRoutes);

router.use("/:tenantId", tenantRouter);

export default router;
