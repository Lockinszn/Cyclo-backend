import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { JWTUtils } from "@/utils/jwt-utils";
import { AuthenticatedRequest, UserRole } from "@/types/auth-types";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Access token is required",
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

    // Add user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication failed",
      },
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info to request if token is present and valid, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (token && !JWTUtils.isTokenBlacklisted(token)) {
      const payload = JWTUtils.verifyAccessToken(token);
      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication for optional auth
    next();
  }
};

/**
 * Role-based Access Control Middleware
 * Requires specific roles to access the endpoint
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
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

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions to access this resource",
        },
      });
      return;
    }

    next();
  };
};

/**
 * Admin Only Middleware
 */
export const requireAdmin = requireRole("admin");

/**
 * Moderator or Admin Middleware
 */
export const requireModerator = requireRole(["admin", "moderator"]);

/**
 * Rate Limiting Configurations
 */

// General API rate limiter
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED",
      message: "Too many password reset attempts, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification rate limiter
export const emailVerificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 verification requests per hour
  message: {
    success: false,
    error: {
      code: "EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED",
      message: "Too many email verification attempts, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Advanced rate limiter using rate-limiter-flexible for more sophisticated scenarios
const loginAttemptLimiter = new RateLimiterMemory({
  keyPrefix: `login_attempt_`,
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes (900 seconds)
  blockDuration: 900, // Block for 15 minutes
});

/**
 * Advanced login rate limiter middleware
 */
export const advancedLoginRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await loginAttemptLimiter.consume(
      req.ip + "_" + (req.body?.email || "unknown")
    );
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      success: false,
      error: {
        code: "LOGIN_RATE_LIMIT_EXCEEDED",
        message: `Too many login attempts. Try again in ${secs} seconds.`,
        retryAfter: secs,
      },
    });
  }
};

// Registration rate limiter
const registrationLimiter = new RateLimiterMemory({
  keyPrefix: "registration_limiter_",
  points: 3, // Number of registrations
  duration: 3600, // Per hour (3600 seconds)
  blockDuration: 3600, // Block for 1 hour
});

/**
 * Registration rate limiter middleware
 */
export const registrationRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await registrationLimiter.consume(req.ip || "unknown");
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      success: false,
      error: {
        code: "REGISTRATION_RATE_LIMIT_EXCEEDED",
        message: `Too many registration attempts. Try again in ${Math.ceil(
          secs / 60
        )} minutes.`,
        retryAfter: secs,
      },
    });
  }
};

/**
 * Middleware to validate request body exists
 */
export const validateRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUEST_BODY",
        message: "Request body is required",
      },
    });
    return;
  }
  next();
};

/**
 * Middleware to validate Content-Type for JSON requests
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be application/json",
        },
      });
      return;
    }
  }
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove sensitive headers
  res.removeHeader("X-Powered-By");

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
};

/**
 * Error handling middleware for authentication
 */
export const authErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Auth middleware error:", error);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal server error occurred",
      ...(isDevelopment && { details: error.message }),
    },
  });
};

/**
 * Middleware to extract and validate API version
 */
export const validateApiVersion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiVersion = req.headers["api-version"] || req.query.version;

  if (apiVersion && apiVersion !== "v1") {
    res.status(400).json({
      success: false,
      error: {
        code: "UNSUPPORTED_API_VERSION",
        message: "Unsupported API version. Current version is v1.",
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to log authentication events
 */
export const logAuthEvents = (eventType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function (data: any) {
      // Log successful authentication events
      if (res.statusCode < 400) {
        console.log(`Auth Event: ${eventType}`, {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
          email: req.body?.email
            ? `${req.body.email.substring(0, 3)}***`
            : undefined,
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
