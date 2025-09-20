import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  int,
  index,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(), // normalized username (lowercase, case sensitive)
  displayUsername: varchar("display_username", { length: 50 })
    .notNull()
    .unique(), // not normalized, left as it was set by the user.
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 500 }),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 100 }),
  role: mysqlEnum("role", ["user", "admin", "moderator"]).default("user"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isBanned: boolean("is_banned").default(false),
  banReason: text("ban_reason"),
  lastLoginAt: timestamp("last_login_at"),
  postsCount: int("posts_count").default(0),
  followersCount: int("followers_count").default(0),
  followingCount: int("following_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ([
  // Index for role-based queries (admin panel, moderation)
  index("users_role_idx").on(table.role),
  // Index for banned users queries
  index("users_banned_idx").on(table.isBanned),
  // Index for email verification status
  index("users_email_verified_idx").on(table.isEmailVerified),
  // Index for user statistics and leaderboards
  index("users_posts_count_idx").on(table.postsCount),
  index("users_followers_count_idx").on(table.followersCount),
  // Index for recent activity queries
  index("users_last_login_idx").on(table.lastLoginAt),
  // Index for user creation date (analytics, user growth)
  index("users_created_at_idx").on(table.createdAt),
  // Composite index for active users (not banned + email verified)
  index("users_active_idx").on(table.isBanned, table.isEmailVerified),
]));

export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  password: varchar("password", { length: 255 }).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
}, (table) => ([
  // Index for user account lookups
  index("accounts_user_id_idx").on(table.userId),
  // Index for email verification token lookups
  index("accounts_email_verification_token_idx").on(table.emailVerificationToken),
  // Index for password reset token lookups
  index("accounts_password_reset_token_idx").on(table.passwordResetToken),
  // Index for expired token cleanup
  index("accounts_email_verification_expires_idx").on(table.emailVerificationExpires),
  index("accounts_password_reset_expires_idx").on(table.passwordResetExpires),
]));

export const userFollows = mysqlTable("user_follows", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  followerId: varchar("follower_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ([
  // Index for getting followers of a user
  index("user_follows_following_id_idx").on(table.followingId),
  // Index for getting users that a user is following
  index("user_follows_follower_id_idx").on(table.followerId),
  // Composite index for checking if user A follows user B
  index("user_follows_follower_following_idx").on(table.followerId, table.followingId),
  // Index for recent follows (activity feeds)
  index("user_follows_created_at_idx").on(table.createdAt),
]));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;
