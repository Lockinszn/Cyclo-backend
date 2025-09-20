# Cyclo Backend - Implementation Guide for Contributors

Welcome to the Cyclo Backend project! This guide provides comprehensive instructions for implementing features and maintaining code quality across the project.

## 📁 Project Structure

```
src/
├── controllers/     # Request handlers and business logic
├── db/             # Database configuration and schemas
│   └── schemas/    # Drizzle ORM table definitions
├── middleware/     # Express middleware functions
├── routes/         # API route definitions
├── services/       # Business logic and external integrations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
└── server.ts       # Application entry point
```

## 🏗️ Implementation Guidelines

### File Naming Convention

**All files must use kebab-case naming:**

✅ **Correct Examples:**

- `user-service.ts`
- `auth-middleware.ts`
- `post-controller.ts`
- `email-utils.ts`
- `api-types.ts`
- `notification-service.ts`

❌ **Incorrect Examples:**

- `userService.ts` (camelCase)
- `AuthMiddleware.ts` (PascalCase)
- `post_controller.ts` (snake_case)

### Services Implementation

Services contain business logic, data processing, and external API integrations. They should be stateless and focused on a single domain.

**Location:** `src/services/`

#### Sample Service Implementation

```typescript
// src/services/user-service.ts
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { users, userFollows } from "../db/schemas";
import {
  CreateUserData,
  UpdateUserData,
  UserProfile,
} from "../types/user-types";
import { hashPassword, comparePassword } from "../utils/crypto-utils";
import { generateToken } from "../utils/jwt-utils";

export class UserService {
  /**
   * Create a new user account
   */
  static async createUser(userData: CreateUserData): Promise<UserProfile> {
    const hashedPassword = await hashPassword(userData.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName,
        passwordHash: hashedPassword,
        bio: userData.bio || null,
        avatarUrl: userData.avatarUrl || null,
      })
      .returning();

    // Remove sensitive data before returning
    const { passwordHash, ...userProfile } = newUser;
    return userProfile;
  }

  /**
   * Authenticate user and return JWT token
   */
  static async authenticateUser(
    email: string,
    password: string
  ): Promise<{ user: UserProfile; token: string } | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return null;
    }

    const token = generateToken({ userId: user.id, email: user.email });
    const { passwordHash, ...userProfile } = user;

    return { user: userProfile, token };
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        passwordHash: false, // Exclude sensitive data
      },
    });

    return user || null;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: string,
    updateData: UpdateUserData
  ): Promise<UserProfile | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) return null;

    const { passwordHash, ...userProfile } = updatedUser;
    return userProfile;
  }

  /**
   * Follow/unfollow user
   */
  static async toggleFollow(
    followerId: string,
    followingId: string
  ): Promise<{ isFollowing: boolean }> {
    const existingFollow = await db.query.userFollows.findFirst({
      where: and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ),
    });

    if (existingFollow) {
      // Unfollow
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, followingId)
          )
        );
      return { isFollowing: false };
    } else {
      // Follow
      await db.insert(userFollows).values({
        followerId,
        followingId,
      });
      return { isFollowing: true };
    }
  }

  /**
   * Get user followers
   */
  static async getUserFollowers(userId: string, limit = 20, offset = 0) {
    return await db.query.userFollows.findMany({
      where: eq(userFollows.followingId, userId),
      with: {
        follower: {
          columns: {
            passwordHash: false,
          },
        },
      },
      limit,
      offset,
      orderBy: desc(userFollows.createdAt),
    });
  }
}
```

### Controllers Implementation

Controllers handle HTTP requests, validate input, call services, and format responses.

**Location:** `src/controllers/`

#### Sample Controller Implementation

```typescript
// src/controllers/user-controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user-service";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../utils/validation-utils";
import { ApiResponse } from "../types/api-types";

export class UserController {
  /**
   * Create new user account
   * POST /api/v1/users/register
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateCreateUser(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map((detail) => detail.message),
        } as ApiResponse);
        return;
      }

      // Check if user already exists
      const existingUser = await UserService.getUserByEmail(value.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User with this email already exists",
        } as ApiResponse);
        return;
      }

      // Create user
      const newUser = await UserService.createUser(value);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/v1/users/:id
   */
  static async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const user = await UserService.getUserById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: user,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id; // From auth middleware
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        } as ApiResponse);
        return;
      }

      const { error, value } = validateUpdateUser(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map((detail) => detail.message),
        } as ApiResponse);
        return;
      }

      const updatedUser = await UserService.updateUser(userId, value);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
```

### Types Implementation

Define TypeScript interfaces and types for type safety and better development experience.

**Location:** `src/types/`

#### Sample Types Implementation

```typescript
// src/types/user-types.ts
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  displayName: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

// src/types/api-types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
```

### Middleware Implementation

Middleware functions for authentication, validation, error handling, etc.

**Location:** `src/middleware/`

#### Sample Middleware Implementation

```typescript
// src/middleware/auth-middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt-utils";
import { UserService } from "../services/user-service";
import { ApiResponse } from "../types/api-types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      } as ApiResponse);
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      } as ApiResponse);
      return;
    }

    // Verify user still exists
    const user = await UserService.getUserById(decoded.userId);
    if (!user) {
      res.status(403).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Token verification failed",
    } as ApiResponse);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await UserService.getUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
```

### Utils Implementation

Utility functions for common operations like validation, encryption, JWT handling, etc.

**Location:** `src/utils/`

#### Sample Utils Implementation

```typescript
// src/utils/validation-utils.ts
import Joi from "joi";

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  displayName: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(8).required(),
  bio: Joi.string().max(500).optional(),
  avatarUrl: Joi.string().uri().optional(),
});

export const updateUserSchema = Joi.object({
  displayName: Joi.string().min(1).max(100).optional(),
  bio: Joi.string().max(500).optional(),
  avatarUrl: Joi.string().uri().optional(),
});

export const validateCreateUser = (data: any) =>
  createUserSchema.validate(data);
export const validateUpdateUser = (data: any) =>
  updateUserSchema.validate(data);

// src/utils/crypto-utils.ts
import bcrypt from "bcryptjs";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// src/utils/jwt-utils.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};
```

### Route Implementation

Routes should be thin and delegate to controllers.

```typescript
// src/routes/users.ts
import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import { authenticateToken, optionalAuth } from "../middleware/auth-middleware";

const router = Router();

// Public routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/:id", optionalAuth, UserController.getUserProfile);

// Protected routes
router.put("/profile", authenticateToken, UserController.updateProfile);
router.post("/:id/follow", authenticateToken, UserController.toggleFollow);
router.get("/:id/followers", UserController.getFollowers);
router.get("/:id/following", UserController.getFollowing);

export default router;
```

## 🗄️ Database Guidelines

### Schema Files

- Use Drizzle ORM for database operations
- Keep schemas in `src/db/schemas/`
- Use kebab-case for schema file names
- Add comprehensive indexes for query optimization

### Migration Commands

```bash
# Generate migration files
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## 🧪 Testing Guidelines

### Test File Structure

```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── middleware/
├── integration/
│   └── routes/
└── fixtures/
    └── test-data.ts
```

### Sample Test Implementation

```typescript
// tests/unit/services/user-service.test.ts
import { UserService } from "../../../src/services/user-service";
import { db } from "../../../src/db";

describe("UserService", () => {
  beforeEach(async () => {
    // Setup test database
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        password: "password123",
      };

      const user = await UserService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user).not.toHaveProperty("passwordHash");
    });
  });
});
```

## 📝 Code Quality Standards

### ESLint Configuration

The project uses ESLint with TypeScript support. Run linting with:

```bash
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues
```

### Error Handling

Always use proper error handling:

```typescript
// In services
export class PostService {
  static async createPost(postData: CreatePostData): Promise<Post> {
    try {
      // Implementation
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error("Failed to create post");
    }
  }
}

// In controllers
export class PostController {
  static async createPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Implementation
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }
}
```

### Environment Variables

## 🚀 Development Workflow

1. **Setup Development Environment**

   ```bash
   pnpm install
   cp .env.example .env
   # Configure your .env file

   ```

2. **Start Development Server**

   ```bash
   pnpm dev
   ```

3. **Before Committing (Nice to have)**
   ```bash
   pnpm lint:fix
   pnpm test
   pnpm build
   ```

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🤝 Contributing

1. Follow the file naming conventions (kebab-case)
2. Implement proper error handling
3. Add comprehensive tests
4. Update documentation when needed
5. Use TypeScript strictly (no `any` types)
6. Follow the established patterns in existing code

---

Happy coding! 🎉
