import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int } from 'drizzle-orm/mysql-core';
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
  targetType: mysqlEnum('target_type', ['post', 'comment', 'user', 'bookmark']),
  targetId: varchar('target_id', { length: 128 }),
  metadata: text('metadata'), // JSON string for additional activity data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});



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
});

// Type exports
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type PostShare = typeof postShares.$inferSelect;
export type NewPostShare = typeof postShares.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;