import { Router } from "express";
import { AuthController } from "@/controllers/auth-controller";
import {
  authenticateToken,
  optionalAuth,
  authRateLimit,
  advancedLoginRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  registrationRateLimit,
  validateRequestBody,
  validateContentType,
  securityHeaders,
  authErrorHandler,
} from "@/middleware/auth-middleware";

const router: Router = Router();

// Apply security headers to all auth routes
router.use(securityHeaders);

// Apply content type validation to POST routes
router.use(validateContentType);

// Health check endpoint (no rate limiting)
router.get("/health", AuthController.health);

// Public authentication endpoints with rate limiting

// POST /api/v1/auth/register - User registration
router.post(
  "/register",
  registrationRateLimit,
  validateRequestBody,
  AuthController.register
);

// POST /api/v1/auth/login - User login
router.post(
  "/login",
  advancedLoginRateLimit,
  validateRequestBody,
  AuthController.login
);

// POST /api/v1/auth/refresh - Token refresh
router.post(
  "/refresh",
  authRateLimit,
  validateRequestBody,
  AuthController.refresh
);

// POST /api/v1/auth/forgot-password - Password reset request
router.post(
  "/forgot-password",
  passwordResetRateLimit,
  validateRequestBody,
  AuthController.forgotPassword
);

// POST /api/v1/auth/reset-password - Password reset confirmation
router.post(
  "/reset-password",
  passwordResetRateLimit,
  validateRequestBody,
  AuthController.resetPassword
);

// POST /api/v1/auth/verify-email - Email verification
router.post(
  "/verify-email",
  emailVerificationRateLimit,
  validateRequestBody,
  AuthController.verifyEmail
);

// POST /api/v1/auth/resend-verification - Resend email verification
router.post(
  "/resend-verification",
  emailVerificationRateLimit,
  validateRequestBody,
  AuthController.resendVerification
);

// POST /api/v1/auth/validate-token - Validate JWT token
router.post(
  "/validate-token",
  authRateLimit,
  validateRequestBody,
  AuthController.validateToken
);

// Protected authentication endpoints (require authentication)

// POST /api/v1/auth/logout - User logout
router.post("/logout", authRateLimit, authenticateToken, AuthController.logout);

// GET /api/v1/auth/me - Get current user profile
router.get("/me", authRateLimit, authenticateToken, AuthController.getMe);

// POST /api/v1/auth/change-password - Change password (authenticated)
router.post(
  "/change-password",
  authRateLimit,
  authenticateToken,
  validateRequestBody,
  AuthController.changePassword
);

// Error handling middleware (should be last)
router.use(authErrorHandler);

export default router;
