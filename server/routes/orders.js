import express from "express";
import orderController from "../controllers/orders.js"; 
import validateInput from "../middlewares/requestValidationMiddleware.js";
import { createOrderDisputeSchema, createOrderSchema, updateOrderSchema, updateOrderStatusSchema } from "../utils/validation.js";
import { getAuthMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";
import { ordersRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/payment/verify", orderController.verifyPayment);

router.post("/", ordersRateLimiter, getAuthMiddleware(), validateInput(createOrderSchema), orderController.createOrder);

router.get("/",getAuthMiddleware(), orderController.getOrdersByUserId);

router.get("/admin", getAuthMiddleware([ROLE_TYPES.ADMIN]), orderController.getAdminOrders);

router.get("/stats", getAuthMiddleware([ROLE_TYPES.ADMIN]), orderController.getOrderStatsAdmin);

router.get("/:slug",getAuthMiddleware(), orderController.getOrderBySlugUser);

router.patch("/:slug/dispute", getAuthMiddleware(), validateInput(createOrderDisputeSchema), orderController.raiseDispute);

router.get("/:slug/admin", getAuthMiddleware([ROLE_TYPES.ADMIN]), orderController.getOrderBySlugAdmin);

router.patch("/:slug/admin", getAuthMiddleware([ROLE_TYPES.ADMIN]), validateInput(updateOrderSchema), orderController.updateOrder);

router.patch("/:slug/status/admin", getAuthMiddleware([ROLE_TYPES.ADMIN]), validateInput(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
