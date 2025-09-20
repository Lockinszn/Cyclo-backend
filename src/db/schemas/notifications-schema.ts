import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  int,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users-schema";

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  recipientId: varchar("recipient_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 128 }).references(() => users.id, {
    onDelete: "set null",
  }),

  type: mysqlEnum("type", [
    "comment",
    "reply",
    "mention",
    "like",
    "follow",
    "bookmark",
    "post_published",
    "post_featured",
    "post_approved",
    "post_rejected",
    "comment_approved",
    "comment_rejected",
    "account_verified",
    "welcome",
    "newsletter",
    "weekly_digest",
  ]).notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Related content
  relatedType: mysqlEnum("related_type", ["post", "comment", "user", "system"]),
  relatedId: varchar("related_id", { length: 128 }),

  // Notification metadata
  metadata: json("metadata"), // Additional data like post title, comment excerpt, etc.

  // Delivery channels
  channels: json("channels"), // ['in_app', 'email'] - which channels to send through

  // Status tracking
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  // Email delivery
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),

  // Action buttons/links
  actionUrl: varchar("action_url", { length: 500 }), // URL to open when clicking the notification
  actionText: varchar("action_text", { length: 100 }), // Text for the action button/link
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const notificationTemplates = mysqlTable("notification_templates", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),

  // Template content
  titleTemplate: varchar("title_template", { length: 255 }).notNull(),
  messageTemplate: text("message_template").notNull(),
  emailSubjectTemplate: varchar("email_subject_template", { length: 255 }),
  emailBodyTemplate: text("email_body_template"),

  // Default settings
  defaultChannels: json("default_channels"), // ['in_app', 'email']

  // Template variables documentation
  variables: json("variables"), // Available template variables in the template that can be used in the title and message templates

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const notificationSettings = mysqlTable("notification_settings", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Global settings
  enableInApp: boolean("enable_in_app").default(true),
  enableEmail: boolean("enable_email").default(true),

  // Specific notification types
  commentNotifications: boolean("comment_notifications").default(true),
  replyNotifications: boolean("reply_notifications").default(true),
  mentionNotifications: boolean("mention_notifications").default(true),
  likeNotifications: boolean("like_notifications").default(true),

  // Content notifications
  postPublishedNotifications: boolean("post_published_notifications").default(
    true
  ),
  postModerationNotifications: boolean("post_moderation_notifications").default(
    true
  ),

  newsletterNotifications: boolean("newsletter_notifications").default(true),
  weeklyDigestNotifications: boolean("weekly_digest_notifications").default(
    true
  ),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const notificationQueue = mysqlTable("notification_queue", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  notificationId: varchar("notification_id", { length: 128 })
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  channel: mysqlEnum("channel", ["in_app", "email"]).notNull(),

  status: mysqlEnum("status", [
    "pending",
    "processing",
    "sent",
    "failed",
    "cancelled",
  ]).default("pending"),
  attempts: int("attempts").default(0),
  maxAttempts: int("max_attempts").default(3),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  processedAt: timestamp("processed_at"),

  // Error tracking
  lastError: text("last_error"),
  errorCount: int("error_count").default(0),

  // Provider-specific data
  providerData: json("provider_data"), // Email provider message ID, push notification ID, etc.

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NewNotificationSettings = typeof notificationSettings.$inferInsert;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type NewNotificationQueue = typeof notificationQueue.$inferInsert;
