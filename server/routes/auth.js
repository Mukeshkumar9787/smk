import express from "express";
import authController from "../controllers/auth.js"; // use .js extension
import validateInput from "../middlewares/requestValidationMiddleware.js";
import { loginSchema, loginWithOTPSchema, registerSchema, resetPasswordSchema, verifyGoogleTokenSchema, verifyOTPSchema } from "../utils/validation.js";
import { authRateLimiter } from "../middlewares/rateLimitMiddleware.js";
import { verifyTurnstileToken } from "../middlewares/turnstileMiddleware.js";

const router = express.Router();

// Apply targeted auth rate limiting to all auth routes
router.use(authRateLimiter);

// Register user with Turnstile verification
router.post("/register", verifyTurnstileToken, validateInput(registerSchema), authController.register);

// Reset password
router.post("/reset-password", validateInput(resetPasswordSchema), authController.resetPassword);

// Login user with Turnstile verification
router.post("/login", verifyTurnstileToken, validateInput(loginSchema), authController.login);

// Login with OTP
router.post("/login-with-otp", validateInput(loginWithOTPSchema), authController.loginWithOTP);

// Verify OTP
router.post("/verifyOTP", validateInput(verifyOTPSchema), authController.verifyOTP);

router.post("/verifyGoogleToken", validateInput(verifyGoogleTokenSchema), authController.verifyGoogleToken);

export default router;
