import { eq, and, lt } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, User } from "@/db/schemas/users-schema";
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  AuthResponse,
  ServiceResponse,
} from "@/types/auth-types";
import { CryptoUtils } from "@/utils/crypto-utils";
import { JWTUtils } from "@/utils/jwt-utils";
import { EmailTemplates } from "@/utils/email-templates";
import ms from "ms";
import { init } from "@paralleldrive/cuid2";
import { config } from "@/config";
export class AuthService {
  /**
   * Generate a username from full name
   */

  static generateUsername(fullName: string): {
    username: string;
    displayUsername: string;
  } {
    const cuid = init({ length: 5 });
    const username =
      fullName
        .replace(/\s+/g, "") // Remove spaces
        .replace(/[^\w]+/g, "")
        .slice(0, 10) + cuid(); // Remove special characters
    return {
      username: username.toLowerCase(),
      displayUsername: username,
    };
  }
  /**
   * Register a new user
   */
  static async register(
    data: RegisterRequest
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existingUser) {
        return {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists",
          },
        };
      }

      // Hash password
      const hashedPassword = await CryptoUtils.hashPassword(data.password);

      // Generate email verification token
      const emailVerificationToken = CryptoUtils.generateSecureToken();
      const emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      const generateUsername = AuthService.generateUsername(data.fullName);
      // Create user and account in transaction
      const result = await db.transaction(async (tx) => {
        // Create user
        const [newUser] = await tx
          .insert(users)
          .values({
            email: data.email,
            fullName: data.fullName,
            username: generateUsername.username,
            displayUsername: generateUsername.displayUsername,
            isEmailVerified: false,
          })
          .$returningId();
        if (!newUser) {
          throw new Error("Failed to create user");
        }
        // Create account
        await tx.insert(accounts).values({
          userId: newUser.id,
          password: hashedPassword,
          emailVerificationToken,
          emailVerificationExpires,
        });
        const user = await tx.query.users.findFirst({
          where: eq(users.id, newUser.id),
        });
        if (!user) {
          throw new Error("Failed to create user");
        }
        return user;
      });

      // Send verification email
      await EmailTemplates.sendEmailVerification({
        firstName: data.fullName.split(" ")[0] || "",
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`,
        email: data.email,
      });

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(result.id, result.email);

      const refreshToken = JWTUtils.generateRefreshToken(
        result.id,
        result.email
      );

      // Create user profile response

      return {
        success: true,
        data: {
          user: result,
          accessToken,
          refreshToken,
          expiresIn: ms(JWTUtils.ACCESS_TOKEN_EXPIRY) / 1000, // 15 minutes
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: {
          code: "REGISTRATION_FAILED",
          message: "Failed to register user",
        },
      };
    }
  }

  /**
   * Login user
   */
  static async login(
    data: LoginRequest
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email),
        with: {
          account: true,
          bookmarks: true,
        },
      });

      if (!user || !user.account) {
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        };
      }

      // Check if user is banned
      if (user.isBanned) {
        return {
          success: false,
          error: {
            code: "USER_BANNED",
            message: user.banReason || "Account has been banned",
          },
        };
      }

      // Verify password
      const isValidPassword = await CryptoUtils.comparePassword(
        data.password,
        //@ts-expect-error
        user.account?.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        };
      }

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user.id, user.email);

      const refreshToken = JWTUtils.generateRefreshToken(user.id, user.email);

      return {
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
          expiresIn: ms(JWTUtils.ACCESS_TOKEN_EXPIRY) / 1000, // 15 minutes
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: "Failed to login user",
        },
      };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    data: RefreshTokenRequest
  ): Promise<ServiceResponse<{ accessToken: string; expiresIn: number }>> {
    try {
      // Verify refresh token
      const payload = JWTUtils.verifyRefreshToken(data.refreshToken);
      if (!payload) {
        return {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid refresh token",
          },
        };
      }

      // Check if token is blacklisted
      if (JWTUtils.isTokenBlacklisted(data.refreshToken)) {
        return {
          success: false,
          error: {
            code: "TOKEN_BLACKLISTED",
            message: "Token has been revoked",
          },
        };
      }

      // Get user to ensure they still exist and are not banned
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });

      if (!user || user.isBanned) {
        return {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found or banned",
          },
        };
      }

      // Generate new access token
      const accessToken = JWTUtils.generateAccessToken(user.id, user.email);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: ms(JWTUtils.ACCESS_TOKEN_EXPIRY) / 1000, // 15 minutes
        },
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        error: {
          code: "TOKEN_REFRESH_FAILED",
          message: "Failed to refresh token",
        },
      };
    }
  }

  /**
   * Initiate password reset
   */
  static async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email),
        with: {
          account: true,
        },
      });

      // Always return success to prevent email enumeration
      if (!user || !user.account) {
        return {
          success: true,
          data: {
            message:
              "If an account with that email exists, a password reset link has been sent",
          },
        };
      }

      // Generate password reset token
      const resetToken = CryptoUtils.generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update account with reset token
      await db
        .update(accounts)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        })
        .where(eq(accounts.userId, user.id));

      // Send password reset email
      await EmailTemplates.sendPasswordReset(user.email, {
        email: user.email,
        firstName: user.fullName || user.displayUsername,
        resetUrl: `${config.FRONTEND_URL}/auth/password-reset?token=${resetToken}`,
        expiresIn: JWTUtils.ACCESS_TOKEN_EXPIRY,
      });

      return {
        success: true,
        data: {
          message:
            "If an account with that email exists, a password reset link has been sent",
        },
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: {
          code: "FORGOT_PASSWORD_FAILED",
          message: "Failed to process password reset request",
        },
      };
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find account by reset token
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.passwordResetToken, data.token),
          lt(accounts.passwordResetExpires, new Date())
        ),
        with: {
          user: true,
        },
      });

      if (!account || !account.passwordResetExpires) {
        return {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired reset token",
          },
        };
      }

      // Check if token has expired
      if (new Date() > account.passwordResetExpires) {
        return {
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Reset token has expired",
          },
        };
      }

      // Hash new password
      const hashedPassword = await CryptoUtils.hashPassword(data.password);

      // Update password and clear reset token
      await db
        .update(accounts)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(accounts.id, account.id));

      // Send password changed confirmation email
      await EmailTemplates.sendPasswordChangedConfirmation(
        account.user.email,
        account.user.fullName || account.user.displayUsername
      );

      return {
        success: true,
        data: {
          message: "Password has been reset successfully",
        },
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: {
          code: "RESET_PASSWORD_FAILED",
          message: "Failed to reset password",
        },
      };
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(
    data: VerifyEmailRequest
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find account by verification token
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.emailVerificationToken, data.token),
          lt(accounts.emailVerificationExpires!, new Date())
        ),
        with: {
          user: true,
        },
      });

      if (!account || !account.emailVerificationExpires) {
        return {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired verification token",
          },
        };
      }

      // Check if token has expired
      if (new Date() > account.emailVerificationExpires) {
        return {
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Verification token has expired",
          },
        };
      }

      // Update user as verified and clear verification token
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ isEmailVerified: true })
          .where(eq(users.id, account.userId));

        await tx
          .update(accounts)
          .set({
            emailVerificationToken: null,
            emailVerificationExpires: null,
          })
          .where(eq(accounts.id, account.id));
      });

      // Send welcome email
      await EmailTemplates.sendWelcomeEmail(
        account.user.email,
        account.user.fullName || account.user.displayUsername
      );

      return {
        success: true,
        data: {
          message: "Email verified successfully",
        },
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        error: {
          code: "EMAIL_VERIFICATION_FAILED",
          message: "Failed to verify email",
        },
      };
    }
  }

  /**
   * Resend email verification
   */
  static async resendVerification(
    email: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
          account: true,
        },
      });

      if (!user || !user.account) {
        return {
          success: true,
          data: {
            message:
              "If an account with that email exists and is unverified, a verification email has been sent",
          },
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          error: {
            code: "ALREADY_VERIFIED",
            message: "Email is already verified",
          },
        };
      }

      // Generate new verification token
      const emailVerificationToken = CryptoUtils.generateSecureToken();
      const emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours

      // Update account with new token
      await db
        .update(accounts)
        .set({
          emailVerificationToken,
          emailVerificationExpires,
        })
        .where(eq(accounts.userId, user.id));

      // Send verification email
      await EmailTemplates.sendEmailVerification({
        email: user.email,
        firstName: user.fullName || user.displayUsername,
        verificationUrl: `${config.FRONTEND_URL}/auth/verify-email?token=${emailVerificationToken}`,
      });

      return {
        success: true,
        data: {
          message: "Verification email sent successfully",
        },
      };
    } catch (error) {
      console.error("Resend verification error:", error);
      return {
        success: false,
        error: {
          code: "RESEND_VERIFICATION_FAILED",
          message: "Failed to resend verification email",
        },
      };
    }
  }

  /**
   * Logout user (blacklist token)
   */
  static async logout(
    token: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Add token to blacklist
      JWTUtils.blacklistToken(token);

      return {
        success: true,
        data: {
          message: "Logged out successfully",
        },
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: {
          code: "LOGOUT_FAILED",
          message: "Failed to logout",
        },
      };
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<ServiceResponse<User>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return {
        success: false,
        error: {
          code: "GET_PROFILE_FAILED",
          message: "Failed to get user profile",
        },
      };
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      await db
        .update(accounts)
        .set({
          emailVerificationToken: null,
          emailVerificationExpires: null,
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(
          and(
            lt(accounts.emailVerificationExpires!, now),
            lt(accounts.passwordResetExpires!, now)
          )
        );
    } catch (error) {
      console.error("Token cleanup error:", error);
    }
  }
}
