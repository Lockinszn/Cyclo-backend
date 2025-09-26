import { Request, Response } from "express";
import { AuthService } from "@/services/auth-service";
import { ValidationUtils } from "@/utils/validation-utils";
import { JWTUtils } from "@/utils/jwt-utils";
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
} from "@/types/auth-types";

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const registerData: RegisterRequest = validation.data;

      // Call auth service
      const result = await AuthService.register(registerData);

      if (!result.success) {
        const statusCode =
          result.error?.code === "USER_EXISTS" ||
          result.error?.code === "USERNAME_TAKEN"
            ? 409
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Register controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const loginData: LoginRequest = validation.data;

      // Call auth service
      const result = await AuthService.login(loginData);

      if (!result.success) {
        const statusCode =
          result.error?.code === "INVALID_CREDENTIALS"
            ? 401
            : result.error?.code === "USER_BANNED"
            ? 403
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Login controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (blacklist token)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtils.extractTokenFromHeader(authHeader || "");

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: "NO_TOKEN",
            message: "No token provided",
          },
        });
        return;
      }

      // Call auth service
      const result = await AuthService.logout(token);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Logout controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.refreshTokenSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const refreshData: RefreshTokenRequest = validation.data;

      // Call auth service
      const result = await AuthService.refreshToken(refreshData);

      if (!result.success) {
        const statusCode =
          result.error?.code === "INVALID_TOKEN" ||
          result.error?.code === "TOKEN_BLACKLISTED"
            ? 401
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Refresh controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.forgotPasswordSchema.safeParse(
        req.body
      );
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const forgotPasswordData: ForgotPasswordRequest = validation.data;

      // Call auth service
      const result = await AuthService.forgotPassword(forgotPasswordData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Forgot password controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.resetPasswordSchema.safeParse(
        req.body
      );
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const resetPasswordData: ResetPasswordRequest = validation.data;

      // Call auth service
      const result = await AuthService.resetPassword(resetPasswordData);

      if (!result.success) {
        const statusCode =
          result.error?.code === "INVALID_TOKEN" ||
          result.error?.code === "TOKEN_EXPIRED"
            ? 400
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Reset password controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * Verify email address
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.verifyEmailSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const verifyEmailData: VerifyEmailRequest = validation.data;

      // Call auth service
      const result = await AuthService.verifyEmail(verifyEmailData);

      if (!result.success) {
        const statusCode =
          result.error?.code === "INVALID_TOKEN" ||
          result.error?.code === "TOKEN_EXPIRED"
            ? 400
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Verify email controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resend email verification
   */
  static async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = ValidationUtils.emailSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const email = validation.data;

      // Call auth service
      const result = await AuthService.resendVerification(email);

      if (!result.success) {
        const statusCode =
          result.error?.code === "ALREADY_VERIFIED" ? 400 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Resend verification controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
        return;
      }

      // Call auth service
      const result = await AuthService.getUserProfile(req.user.userId);

      if (!result.success) {
        const statusCode = result.error?.code === "USER_NOT_FOUND" ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Get me controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/validate-token
   * Validate JWT token
   */
  static async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: "NO_TOKEN",
            message: "Token is required",
          },
        });
        return;
      }

      // Check if token is blacklisted
      if (JWTUtils.isTokenBlacklisted(token)) {
        res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_BLACKLISTED",
            message: "Token has been revoked",
          },
        });
        return;
      }

      // Verify token
      const payload = JWTUtils.verifyAccessToken(token);
      if (!payload) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired token",
          },
        });
        return;
      }

      // Get user profile
      const result = await AuthService.getUserProfile(payload.userId);

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: result.data,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        },
      });
    } catch (error) {
      console.error("Validate token controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/change-password
   * Change user password (authenticated)
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
        return;
      }

      // Validate request body
      const validation = ValidationUtils.changePasswordSchema.safeParse(
        req.body
      );
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        });
        return;
      }

      const { currentPassword, newPassword } = validation.data;

      // First verify current password by attempting login
      const loginResult = await AuthService.login({
        email: req.user.email,
        password: currentPassword,
      });

      if (!loginResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CURRENT_PASSWORD",
            message: "Current password is incorrect",
          },
        });
        return;
      }

      // Generate reset token and use reset password flow
      const resetToken = await import("@/utils/crypto-utils").then((m) =>
        m.CryptoUtils.generateSecureToken()
      );

      //TODO: Temporarily store reset token (in production, this should be in database)
      // For now, we'll use the reset password method directly
      const resetResult = await AuthService.resetPassword({
        token: resetToken,
        password: newPassword,
      });

      // Since we can't easily integrate with the existing reset flow,
      // we'll implement a direct password change here
      const { db } = await import("@/db");
      const { accounts } = await import("@/db/schemas/users-schema");
      const { eq } = await import("drizzle-orm");
      const { CryptoUtils } = await import("@/utils/crypto-utils");

      const hashedPassword = await CryptoUtils.hashPassword(newPassword);

      await db
        .update(accounts)
        .set({ password: hashedPassword })
        .where(eq(accounts.userId, req.user.userId));

      res.status(200).json({
        success: true,
        data: {
          message: "Password changed successfully",
        },
      });
    } catch (error) {
      console.error("Change password controller error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred",
        },
      });
    }
  }

  /**
   * GET /api/v1/auth/health
   * Health check endpoint
   */
  static async health(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          service: "auth-service",
        },
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: "Health check failed",
        },
      });
    }
  }
}
