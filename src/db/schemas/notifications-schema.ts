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
    "system_update",
    "security_alert",
    "weekly_digest",
    "trending_post",
    "milestone_reached",
  ]).notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Related content
  relatedType: mysqlEnum("related_type", ["post", "comment", "user", "system"]),
  relatedId: varchar("related_id", { length: 128 }),

  // Notification metadata
  metadata: json("metadata"), // Additional data like post title, comment excerpt, etc.

  // Delivery channels
  channels: json("channels"), // ['in_app', 'email', 'push'] - which channels to send through

  // Status tracking
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),

  // Email delivery
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  emailDelivered: boolean("email_delivered").default(false),
  emailOpened: boolean("email_opened").default(false),

  // Push notification delivery
  pushSent: boolean("push_sent").default(false),
  pushSentAt: timestamp("push_sent_at"),
  pushDelivered: boolean("push_delivered").default(false),
  pushOpened: boolean("push_opened").default(false),

  // Priority and scheduling
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default(
    "normal"
  ),
  scheduledFor: timestamp("scheduled_for"),

  // Action buttons/links
  actionUrl: varchar("action_url", { length: 500 }),
  actionText: varchar("action_text", { length: 100 }),

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
  defaultChannels: json("default_channels"), // ['in_app', 'email', 'push']
  defaultPriority: mysqlEnum("default_priority", [
    "low",
    "normal",
    "high",
    "urgent",
  ]).default("normal"),

  // Template variables documentation
  variables: json("variables"), // Available template variables

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
  postFeaturedNotifications: boolean("post_featured_notifications").default(
    true
  ),
  postModerationNotifications: boolean("post_moderation_notifications").default(
    true
  ),

  // System notifications
  securityAlertNotifications: boolean("security_alert_notifications").default(
    true
  ),
  systemUpdateNotifications: boolean("system_update_notifications").default(
    true
  ),
  newsletterNotifications: boolean("newsletter_notifications").default(true),
  weeklyDigestNotifications: boolean("weekly_digest_notifications").default(
    true
  ),

  // Timing preferences
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default("UTC"),

  // Frequency settings
  digestFrequency: mysqlEnum("digest_frequency", [
    "daily",
    "weekly",
    "monthly",
    "never",
  ]).default("weekly"),
  maxDailyNotifications: int("max_daily_notifications").default(50),

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
  channel: mysqlEnum("channel", ["in_app", "email", "push"]).notNull(),

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

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Push subscription data
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),

  // Device/browser info
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }), // 'desktop', 'mobile', 'tablet'
  browserName: varchar("browser_name", { length: 50 }),

  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used").defaultNow(),

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
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
