import { z } from "zod";
import { CryptoUtils } from "./crypto-utils";

/**
 * Validation utilities for authentication input validation using Zod schemas
 */
export class ValidationUtils {
  // Common validation patterns
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly STRONG_PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  /**
   * Email validation schema
   */
  static readonly emailSchema = z
    .email({})

    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim();

  /**
   * Password validation schema
   */
  static readonly passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters")
    .refine(
      (password) => {
        const validation = CryptoUtils.validatePasswordStrength(password);
        return validation.isValid;
      },
      {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }
    );

  /**
   * Name validation schema (for first name, last name)
   */
  static readonly nameSchema = z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .trim();

  /**
   * Optional name validation schema
   */
  static readonly optionalNameSchema = z
    .string()
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s'-]*$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .trim()
    .optional();

  /**
   * Token validation schema
   */
  static readonly tokenSchema = z
    .string()
    .min(1, "Token is required")
    .max(1000, "Token is too long");

  /**
   * User registration validation schema
   */
  static readonly registerSchema = z.object({
    email: this.emailSchema,
    password: this.passwordSchema,
    firstName: this.optionalNameSchema,
    lastName: this.optionalNameSchema,
  });

  /**
   * User login validation schema
   */
  static readonly loginSchema = z.object({
    email: this.emailSchema,
    password: z.string().min(1, "Password is required"),
  });

  /**
   * Forgot password validation schema
   */
  static readonly forgotPasswordSchema = z.object({
    email: this.emailSchema,
  });

  /**
   * Reset password validation schema
   */
  static readonly resetPasswordSchema = z.object({
    token: this.tokenSchema,
    password: this.passwordSchema,
  });

  /**
   * Email verification validation schema
   */
  static readonly verifyEmailSchema = z.object({
    token: this.tokenSchema,
  });

  /**
   * Refresh token validation schema
   */
  static readonly refreshTokenSchema = z.object({
    refreshToken: this.tokenSchema,
  });

  /**
   * Change password validation schema
   */
  static readonly changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: this.passwordSchema,
  });

  /**
   * Update profile validation schema
   */
  static readonly updateProfileSchema = z
    .object({
      firstName: this.optionalNameSchema,
      lastName: this.optionalNameSchema,
      email: this.emailSchema.optional(),
    })
    .refine(
      (data) => {
        // At least one field must be provided
        return (
          data.firstName !== undefined ||
          data.lastName !== undefined ||
          data.email !== undefined
        );
      },
      {
        message: "At least one field must be provided for update",
      }
    );

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns boolean - True if email is valid
   */
  static isValidEmail(email: string): boolean {
    try {
      this.emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns object - Validation result
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      this.passwordSchema.parse(password);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((err) => err.message),
        };
      }
      return { isValid: false, errors: ["Invalid password"] };
    }
  }

  /**
   * Sanitize input string
   * @param input - Input string to sanitize
   * @returns string - Sanitized string
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/['"]/g, "") // Remove quotes to prevent injection
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize registration data
   * @param data - Registration data
   * @returns object - Validated and sanitized data
   */
  static validateRegistration(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.registerSchema.parse(data);
      return {
        isValid: true,
        data: {
          ...validatedData,
          firstName: validatedData.firstName
            ? this.sanitizeInput(validatedData.firstName)
            : undefined,
          lastName: validatedData.lastName
            ? this.sanitizeInput(validatedData.lastName)
            : undefined,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Validate login data
   * @param data - Login data
   * @returns object - Validation result
   */
  static validateLogin(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.loginSchema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Validate forgot password data
   * @param data - Forgot password data
   * @returns object - Validation result
   */
  static validateForgotPassword(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.forgotPasswordSchema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Validate reset password data
   * @param data - Reset password data
   * @returns object - Validation result
   */
  static validateResetPassword(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.resetPasswordSchema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Validate email verification data
   * @param data - Email verification data
   * @returns object - Validation result
   */
  static validateEmailVerification(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.verifyEmailSchema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Validate refresh token data
   * @param data - Refresh token data
   * @returns object - Validation result
   */
  static validateRefreshToken(data: any): {
    isValid: boolean;
    data?: any;
    errors?: string[];
  } {
    try {
      const validatedData = this.refreshTokenSchema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Validation failed"] };
    }
  }

  /**
   * Check for common password patterns that should be avoided
   * @param password - Password to check
   * @returns object - Pattern check result
   */
  static checkPasswordPatterns(password: string): {
    hasCommonPatterns: boolean;
    patterns: string[];
  } {
    const patterns: string[] = [];

    // Check for common patterns
    if (/123456|password|qwerty|abc123|admin|letmein/i.test(password)) {
      patterns.push("Contains common password patterns");
    }

    if (/(.)\1{3,}/.test(password)) {
      patterns.push("Contains repeated characters");
    }

    if (/^[a-zA-Z]+$/.test(password)) {
      patterns.push("Contains only letters");
    }

    if (/^\d+$/.test(password)) {
      patterns.push("Contains only numbers");
    }

    if (/^[a-z]+$/.test(password)) {
      patterns.push("Contains only lowercase letters");
    }

    if (/^[A-Z]+$/.test(password)) {
      patterns.push("Contains only uppercase letters");
    }

    return {
      hasCommonPatterns: patterns.length > 0,
      patterns,
    };
  }

  /**
   * Validate request body size
   * @param body - Request body
   * @param maxSize - Maximum size in bytes (default: 1MB)
   * @returns boolean - True if size is valid
   */
  static validateRequestSize(
    body: any,
    maxSize: number = 1024 * 1024
  ): boolean {
    const bodyString = JSON.stringify(body);
    const sizeInBytes = Buffer.byteLength(bodyString, "utf8");
    return sizeInBytes <= maxSize;
  }

  /**
   * Validate rate limit key format
   * @param key - Rate limit key
   * @returns boolean - True if key format is valid
   */
  static validateRateLimitKey(key: string): boolean {
    return /^[a-zA-Z0-9_.-]+$/.test(key) && key.length <= 100;
  }
}
