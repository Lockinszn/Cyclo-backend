import jwt from "jsonwebtoken";
import { JWTPayload, TokenType, BlacklistedToken } from "../types/auth-types";

/**
 * JWT utilities for token generation, verification, and blacklist management
 */
export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRY = "15m";
  private static readonly REFRESH_TOKEN_EXPIRY = "7d";
  private static readonly EMAIL_TOKEN_EXPIRY = "24h";
  private static readonly PASSWORD_RESET_TOKEN_EXPIRY = "1h";

  // In-memory token blacklist (in production, use Redis or database)
  private static tokenBlacklist: Set<string> = new Set();
  private static blacklistedTokens: Map<string, BlacklistedToken> = new Map();

  /**
   * Get JWT secret from environment variables
   * @param tokenType - Type of token (access, refresh, etc.)
   * @returns string - JWT secret
   */
  private static getJWTSecret(tokenType: TokenType = "access"): string {
    const secrets = {
      access: process.env.JWT_ACCESS_SECRET,
      refresh: process.env.JWT_REFRESH_SECRET,
      email_verification: process.env.JWT_EMAIL_SECRET,
      password_reset: process.env.JWT_PASSWORD_RESET_SECRET,
    };

    const secret = secrets[tokenType] || process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(`JWT secret not found for token type: ${tokenType}`);
    }

    return secret;
  }

  /**
   * Get token expiry time based on token type
   * @param tokenType - Type of token
   * @returns string - Expiry time
   */
  private static getTokenExpiry(tokenType: TokenType): string {
    const expiries = {
      access: this.ACCESS_TOKEN_EXPIRY,
      refresh: this.REFRESH_TOKEN_EXPIRY,
      email_verification: this.EMAIL_TOKEN_EXPIRY,
      password_reset: this.PASSWORD_RESET_TOKEN_EXPIRY,
    };

    return expiries[tokenType] || this.ACCESS_TOKEN_EXPIRY;
  }

  /**
   * Generate a JWT token
   * @param payload - JWT payload
   * @param tokenType - Type of token to generate
   * @returns string - Generated JWT token
   */
  static generateToken(
    payload: Omit<JWTPayload, "type" | "iat" | "exp">,
    tokenType: TokenType = "access"
  ): string {
    try {
      const secret = this.getJWTSecret(tokenType);
      const expiry = this.getTokenExpiry(tokenType);

      const tokenPayload: JWTPayload = {
        ...payload,
        type: tokenType,
      };

      return jwt.sign(tokenPayload, secret, {
        expiresIn: expiry as any,
        issuer: "cyclo-backend",
        audience: "cyclo-frontend",
      });
    } catch (error) {
      throw new Error(
        `Failed to generate ${tokenType} token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate access token
   * @param userId - User ID
   * @param email - User email
   * @returns string - Access token
   */
  static generateAccessToken(userId: string, email: string): string {
    return this.generateToken({ userId, email }, "access");
  }

  /**
   * Generate refresh token
   * @param userId - User ID
   * @param email - User email
   * @returns string - Refresh token
   */
  static generateRefreshToken(userId: string, email: string): string {
    return this.generateToken({ userId, email }, "refresh");
  }

  /**
   * Generate email verification token
   * @param userId - User ID
   * @param email - User email
   * @returns string - Email verification token
   */
  static generateEmailVerificationToken(userId: string, email: string): string {
    return this.generateToken({ userId, email }, "email_verification");
  }

  /**
   * Generate password reset token
   * @param userId - User ID
   * @param email - User email
   * @returns string - Password reset token
   */
  static generatePasswordResetToken(userId: string, email: string): string {
    return this.generateToken({ userId, email }, "password_reset");
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @param tokenType - Expected token type
   * @returns JWTPayload - Decoded token payload
   */
  static verifyToken(
    token: string,
    tokenType: TokenType = "access"
  ): JWTPayload {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        throw new Error("Token has been revoked");
      }

      const secret = this.getJWTSecret(tokenType);

      const decoded = jwt.verify(token, secret, {
        issuer: "cyclo-backend",
        audience: "cyclo-frontend",
      }) as JWTPayload;

      // Verify token type matches expected type
      if (decoded.type !== tokenType) {
        throw new Error(
          `Invalid token type. Expected: ${tokenType}, Got: ${decoded.type}`
        );
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error("Token not active yet");
      }
      throw error;
    }
  }

  /**
   * Verify access token
   * @param token - Access token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyAccessToken(token: string): JWTPayload {
    return this.verifyToken(token, "access");
  }

  /**
   * Verify refresh token
   * @param token - Refresh token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyRefreshToken(token: string): JWTPayload {
    return this.verifyToken(token, "refresh");
  }

  /**
   * Verify email verification token
   * @param token - Email verification token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyEmailVerificationToken(token: string): JWTPayload {
    return this.verifyToken(token, "email_verification");
  }

  /**
   * Verify password reset token
   * @param token - Password reset token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyPasswordResetToken(token: string): JWTPayload {
    return this.verifyToken(token, "password_reset");
  }

  /**
   * Decode token without verification (for debugging purposes)
   * @param token - JWT token to decode
   * @returns any - Decoded token payload
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error("Failed to decode token");
    }
  }

  /**
   * Get token expiration date
   * @param token - JWT token
   * @returns Date - Token expiration date
   */
  static getTokenExpiration(token: string): Date {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        throw new Error("Invalid token or missing expiration");
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      throw new Error("Failed to get token expiration");
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token
   * @returns boolean - True if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      return expiration < new Date();
    } catch (error) {
      return true;
    }
  }

  /**
   * Add token to blacklist
   * @param token - Token to blacklist
   */
  static blacklistToken(token: string): void {
    try {
      const expiration = this.getTokenExpiration(token);
      const blacklistedToken: BlacklistedToken = {
        token,
        expiresAt: expiration,
        createdAt: new Date(),
      };

      this.tokenBlacklist.add(token);
      this.blacklistedTokens.set(token, blacklistedToken);
    } catch (error) {
      throw new Error("Failed to blacklist token");
    }
  }

  /**
   * Check if token is blacklisted
   * @param token - Token to check
   * @returns boolean - True if token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  /**
   * Clean up expired blacklisted tokens
   */
  static cleanupExpiredTokens(): void {
    const now = new Date();

    for (const [token, blacklistedToken] of this.blacklistedTokens.entries()) {
      if (blacklistedToken.expiresAt < now) {
        this.tokenBlacklist.delete(token);
        this.blacklistedTokens.delete(token);
      }
    }
  }

  /**
   * Get all blacklisted tokens (for admin purposes)
   * @returns BlacklistedToken[] - Array of blacklisted tokens
   */
  static getBlacklistedTokens(): BlacklistedToken[] {
    return Array.from(this.blacklistedTokens.values());
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  static clearBlacklist(): void {
    this.tokenBlacklist.clear();
    this.blacklistedTokens.clear();
  }

  /**
   * Generate token pair (access and refresh tokens)
   * @param userId - User ID
   * @param email - User email
   * @returns object - Access and refresh tokens
   */
  static generateTokenPair(
    userId: string,
    email: string
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(userId, email),
      refreshToken: this.generateRefreshToken(userId, email),
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Valid refresh token
   * @returns object - New access and refresh tokens
   */
  static refreshAccessToken(refreshToken: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // Blacklist the old refresh token
      this.blacklistToken(refreshToken);

      // Generate new token pair
      return this.generateTokenPair(decoded.userId, decoded.email);
    } catch (error) {
      throw new Error(
        `Failed to refresh token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns string - Extracted token
   */
  static extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new Error("Authorization header is missing");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new Error("Invalid authorization header format");
    }

    return parts[1] as string;
  }
}
