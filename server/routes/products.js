import express from "express";
import productController from "../controllers/products.js"; 
import validateInput from "../middlewares/requestValidationMiddleware.js"
import { productBodySchema, productReviewSchema, productUpdateSchema, reviewVisibilitySchema, restockProductSchema } from "../utils/validation.js";
import { getAuthMiddleware } from "../middlewares/authMiddleware.js";
import { agentAuthMiddleware } from "../middlewares/agentAuthMiddleware.js";
import { ROLE_TYPES } from "../utils/constants.js";

const router = express.Router();

// Get all categories
router.get("/active", productController.getActiveProducts);

// Restock product stock (protected: requires agent API key or admin authorization)
router.post("/restock", agentAuthMiddleware, validateInput(restockProductSchema), productController.restockProduct);


// Get single product by ID
router.get("/admin/:slug", getAuthMiddleware([ROLE_TYPES.ADMIN]), productController.getProductBySlugAdmin);
router.get("/:slug", productController.getProductBySlug);

router.get("/:id/reviews", productController.getProductReviews);

router.get("/:id/reviews/me", getAuthMiddleware(), productController.getMyProductReview);

router.post("/:id/reviews", getAuthMiddleware(), validateInput(productReviewSchema), productController.addOrUpdateProductReview);
router.patch("/reviews/:reviewId/me", getAuthMiddleware(), validateInput(productReviewSchema), productController.updateMyProductReview);
router.delete("/reviews/:reviewId/me", getAuthMiddleware(), productController.deleteMyProductReview);

router.post("/:id/notify-me", getAuthMiddleware(), productController.subscribeProductRestockNotification);

router.use(getAuthMiddleware([ROLE_TYPES.ADMIN]));

router.get("/:id/reviews/admin", productController.getProductReviewsAdmin);

router.patch("/reviews/:reviewId/visibility", validateInput(reviewVisibilitySchema), productController.updateProductReviewVisibility);

router.get("/", productController.getProducts);

// Create product
router.post("/", validateInput(productBodySchema),productController.createProduct);

// Update product
router.put("/:id", validateInput(productUpdateSchema), productController.updateProduct);

// Delete product
router.delete("/:id", productController.deleteProduct);

export default router;
