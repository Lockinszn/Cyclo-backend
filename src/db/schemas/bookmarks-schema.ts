import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int, index } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users-schema';
import { posts } from './posts-schema';

export const bookmarks = mysqlTable('bookmarks', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  notes: text('notes'), // Personal notes about the bookmark
  isPrivate: boolean('is_private').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting bookmarks of a user
  index('bookmarks_user_id_idx').on(table.userId),
  // Index for getting bookmarks of a post
  index('bookmarks_post_id_idx').on(table.postId),
  // Index for privacy filtering
  index('bookmarks_is_private_idx').on(table.isPrivate),
  // Index for bookmark timestamps
  index('bookmarks_created_at_idx').on(table.createdAt),
  // Composite index for checking if user bookmarked a post
  index('bookmarks_user_post_idx').on(table.userId, table.postId),
  // Composite index for user's public bookmarks
  index('bookmarks_user_private_idx').on(table.userId, table.isPrivate),
]));



export const postShares = mysqlTable('post_shares', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  platform: mysqlEnum('platform', ['twitter', 'facebook', 'linkedin', 'reddit', 'email', 'copy_link', 'other']).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: varchar('referrer', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting shares of a post
  index('post_shares_post_id_idx').on(table.postId),
  // Index for getting shares by a user
  index('post_shares_user_id_idx').on(table.userId),
  // Index for platform analytics
  index('post_shares_platform_idx').on(table.platform),
  // Index for share timestamps (analytics)
  index('post_shares_created_at_idx').on(table.createdAt),
  // Index for IP-based analytics
  index('post_shares_ip_address_idx').on(table.ipAddress),
  // Composite index for post platform analytics
  index('post_shares_post_platform_idx').on(table.postId, table.platform),
]));

export const userActivity = mysqlTable('user_activity', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: mysqlEnum('activity_type', [
    'post_created', 'post_updated', 'post_deleted', 'post_published',
    'comment_created', 'comment_updated', 'comment_deleted',
    'post_liked', 'post_unliked', 'comment_liked', 'comment_unliked',
    'post_bookmarked', 'post_unbookmarked', 'post_shared',
    'user_followed', 'user_unfollowed',
    'profile_updated', 'login', 'logout'
  ]).notNull(),
  targetType: mysqlEnum('target_type', ['post', 'comment', 'user', 'bookmark']),
  targetId: varchar('target_id', { length: 128 }),
  metadata: text('metadata'), // JSON string for additional activity data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting activities of a user
  index('user_activity_user_id_idx').on(table.userId),
  // Index for activity type filtering
  index('user_activity_activity_type_idx').on(table.activityType),
  // Index for target type filtering
  index('user_activity_target_type_idx').on(table.targetType),
  // Index for target lookups
  index('user_activity_target_id_idx').on(table.targetId),
  // Index for activity timestamps
  index('user_activity_created_at_idx').on(table.createdAt),
  // Composite index for user activity feeds
  index('user_activity_user_created_idx').on(table.userId, table.createdAt),
  // Composite index for activity type analytics
  index('user_activity_type_created_idx').on(table.activityType, table.createdAt),
  // Composite index for target activity tracking
  index('user_activity_target_type_id_idx').on(table.targetType, table.targetId),
]));



export const userPreferences = mysqlTable('user_preferences', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification preferences
  emailNotifications: boolean('email_notifications').default(true),
  inAppNotifications: boolean('in_app_notifications').default(true),
  commentNotifications: boolean('comment_notifications').default(true),
  likeNotifications: boolean('like_notifications').default(true),
  followNotifications: boolean('follow_notifications').default(true),
  mentionNotifications: boolean('mention_notifications').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ([
  // Index for user preference lookups (already unique, but for consistency)
  index('user_preferences_user_id_idx').on(table.userId),
  // Index for email notification preferences
  index('user_preferences_email_notifications_idx').on(table.emailNotifications),
  // Index for in-app notification preferences
  index('user_preferences_in_app_notifications_idx').on(table.inAppNotifications),
]));

// Type exports
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type PostShare = typeof postShares.$inferSelect;
export type NewPostShare = typeof postShares.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;