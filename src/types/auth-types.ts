import { type Request } from "express";

// User-related interfaces
export interface User {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication request interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Authentication response interfaces
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
    message: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface GenericResponse {
  success: boolean;
  message: string;
  data?: any;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh" | "email_verification" | "password_reset";
  iat?: number;
  exp?: number;
  role?: UserRole;
  isEmailVerified?: boolean;
}

// User session interface
export interface UserSession {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
}

// Extended Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    isEmailVerified: boolean;
    role: UserRole;
  };
}

// Token blacklist interface
export interface BlacklistedToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Rate limiting interfaces
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

// Email template interfaces
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailVerificationData {
  firstName?: string;
  email: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  firstName?: string;
  email: string;
  resetUrl: string;
  expiresIn: string;
}

// Error interfaces
export interface AuthError extends Error {
  statusCode: number;
  code?: string;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Service response interface
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Token types
export type TokenType =
  | "access"
  | "refresh"
  | "email_verification"
  | "password_reset";

// User roles (for future role-based access control)
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

// Authentication status
export enum AuthStatus {
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  TOKEN_EXPIRED = "token_expired",
  TOKEN_INVALID = "token_invalid",
}
