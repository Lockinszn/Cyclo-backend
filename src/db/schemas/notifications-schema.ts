import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  int,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
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
}, (table) => ([
  // Index for recipient notifications
  index("notifications_recipient_id_idx").on(table.recipientId),
  // Index for sender notifications
  index("notifications_sender_id_idx").on(table.senderId),
  // Index for notification type filtering
  index("notifications_type_idx").on(table.type),
  // Index for read status filtering
  index("notifications_is_read_idx").on(table.isRead),
  // Index for notification timestamps
  index("notifications_created_at_idx").on(table.createdAt),
  // Composite index for recipient's unread notifications
  index("notifications_recipient_unread_idx").on(table.recipientId, table.isRead),
  // Composite index for recipient's notifications by time
  index("notifications_recipient_created_idx").on(table.recipientId, table.createdAt),
  // Composite index for notification type analytics
  index("notifications_type_created_idx").on(table.type, table.createdAt),
]));

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
}, (table) => ([
  // Index for template type lookups
  index("notification_templates_type_idx").on(table.type),
  // Index for active template filtering
  index("notification_templates_is_active_idx").on(table.isActive),
]));

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
}, (table) => ([
  // Index for user settings lookup (already unique, but for consistency)
  index("notification_settings_user_id_idx").on(table.userId),
  // Index for email enabled users
  index("notification_settings_enable_email_idx").on(table.enableEmail),
  // Index for in-app enabled users
  index("notification_settings_enable_in_app_idx").on(table.enableInApp),
]));

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
}, (table) => ([
  // Index for notification queue lookups
  index("notification_queue_notification_id_idx").on(table.notificationId),
  // Index for channel filtering
  index("notification_queue_channel_idx").on(table.channel),
  // Index for status filtering (critical for queue processing)
  index("notification_queue_status_idx").on(table.status),
  // Index for scheduled processing
  index("notification_queue_scheduled_for_idx").on(table.scheduledFor),
  // Index for attempts tracking
  index("notification_queue_attempts_idx").on(table.attempts),
  // Composite index for queue processing (status + scheduled time)
  index("notification_queue_status_scheduled_idx").on(table.status, table.scheduledFor),
  // Composite index for channel-specific queue processing
  index("notification_queue_channel_status_idx").on(table.channel, table.status),
  // Composite index for retry management
  index("notification_queue_status_attempts_idx").on(table.status, table.attempts),
]));

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NewNotificationSettings = typeof notificationSettings.$inferInsert;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type NewNotificationQueue = typeof notificationQueue.$inferInsert;

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "notificationRecipient",
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "notificationSender",
  }),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationQueue.notificationId],
    references: [notifications.id],
  }),
}));
