import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users-schema';
import { posts } from './posts-schema';
import { comments } from './comments-schema';

export const bookmarks = mysqlTable('bookmarks', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  collectionId: varchar('collection_id', { length: 128 }).references(() => bookmarkCollections.id, { onDelete: 'set null' }),
  notes: text('notes'), // Personal notes about the bookmark
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookmarkCollections = mysqlTable('bookmark_collections', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#8b5cf6'), // Purple theme
  icon: varchar('icon', { length: 100 }),
  isPrivate: boolean('is_private').default(false),
  bookmarksCount: int('bookmarks_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const postShares = mysqlTable('post_shares', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  platform: mysqlEnum('platform', ['twitter', 'facebook', 'linkedin', 'reddit', 'email', 'copy_link', 'other']).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: varchar('referrer', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

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
  targetType: mysqlEnum('target_type', ['post', 'comment', 'user', 'bookmark', 'collection']),
  targetId: varchar('target_id', { length: 128 }),
  metadata: text('metadata'), // JSON string for additional activity data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const readingHistory = mysqlTable('reading_history', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  readingProgress: int('reading_progress').default(0), // Percentage read (0-100)
  timeSpent: int('time_spent').default(0), // Time spent reading in seconds
  isCompleted: boolean('is_completed').default(false),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userPreferences = mysqlTable('user_preferences', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification preferences
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  commentNotifications: boolean('comment_notifications').default(true),
  likeNotifications: boolean('like_notifications').default(true),
  followNotifications: boolean('follow_notifications').default(true),
  mentionNotifications: boolean('mention_notifications').default(true),
  
  // Content preferences
  showNSFWContent: boolean('show_nsfw_content').default(false),
  autoplayVideos: boolean('autoplay_videos').default(true),
  
  // Privacy preferences
  showEmail: boolean('show_email').default(false),
  showOnlineStatus: boolean('show_online_status').default(true),
  allowDirectMessages: boolean('allow_direct_messages').default(true),
  
  // Display preferences
  theme: mysqlEnum('theme', ['light', 'dark', 'auto']).default('auto'),
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const reportedContent = mysqlTable('reported_content', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  reporterId: varchar('reporter_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: mysqlEnum('content_type', ['post', 'comment', 'user']).notNull(),
  contentId: varchar('content_id', { length: 128 }).notNull(),
  reason: mysqlEnum('reason', ['spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'violence', 'other']).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['pending', 'under_review', 'resolved', 'dismissed']).default('pending'),
  reviewedBy: varchar('reviewed_by', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  actionTaken: varchar('action_taken', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type BookmarkCollection = typeof bookmarkCollections.$inferSelect;
export type NewBookmarkCollection = typeof bookmarkCollections.$inferInsert;
export type PostShare = typeof postShares.$inferSelect;
export type NewPostShare = typeof postShares.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;
export type ReadingHistory = typeof readingHistory.$inferSelect;
export type NewReadingHistory = typeof readingHistory.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type ReportedContent = typeof reportedContent.$inferSelect;
export type NewReportedContent = typeof reportedContent.$inferInsert;