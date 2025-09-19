import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users-schema';
import { posts } from './posts-schema';

export const comments = mysqlTable('comments', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  
  // For nested comments/replies
  parentId: varchar('parent_id', { length: 128 }).references(() => comments.id, { onDelete: 'cascade' }),
  rootId: varchar('root_id', { length: 128 }).references(() => comments.id, { onDelete: 'cascade' }),
  depth: int('depth').default(0), // 0 for top-level comments, 1+ for replies
  
  // Moderation
  status: mysqlEnum('status', ['published', 'pending', 'approved', 'rejected', 'spam', 'deleted']).default('published'),
  moderatedBy: varchar('moderated_by', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  moderatedAt: timestamp('moderated_at'),
  moderationReason: text('moderation_reason'),
  
  // Engagement
  likesCount: int('likes_count').default(0),
  repliesCount: int('replies_count').default(0),
  
  // Flags and reports
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  isFlagged: boolean('is_flagged').default(false),
  flagsCount: int('flags_count').default(0),
  
  // Author info at time of comment (for deleted users)
  authorName: varchar('author_name', { length: 100 }),
  authorAvatar: varchar('author_avatar', { length: 500 }),
  
  // IP tracking for moderation
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const commentLikes = mysqlTable('comment_likes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  commentId: varchar('comment_id', { length: 128 }).notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const commentFlags = mysqlTable('comment_flags', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  commentId: varchar('comment_id', { length: 128 }).notNull().references(() => comments.id, { onDelete: 'cascade' }),
  reporterId: varchar('reporter_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: mysqlEnum('reason', ['spam', 'harassment', 'inappropriate', 'off_topic', 'misinformation', 'other']).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['pending', 'reviewed', 'resolved', 'dismissed']).default('pending'),
  reviewedBy: varchar('reviewed_by', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const commentRevisions = mysqlTable('comment_revisions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  commentId: varchar('comment_id', { length: 128 }).notNull().references(() => comments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  revisionNumber: int('revision_number').notNull(),
  editReason: varchar('edit_reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Mentions in comments
export const commentMentions = mysqlTable('comment_mentions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  commentId: varchar('comment_id', { length: 128 }).notNull().references(() => comments.id, { onDelete: 'cascade' }),
  mentionedUserId: varchar('mentioned_user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  mentionedByUserId: varchar('mentioned_by_user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  isNotified: boolean('is_notified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
export type CommentFlag = typeof commentFlags.$inferSelect;
export type NewCommentFlag = typeof commentFlags.$inferInsert;
export type CommentRevision = typeof commentRevisions.$inferSelect;
export type NewCommentRevision = typeof commentRevisions.$inferInsert;
export type CommentMention = typeof commentMentions.$inferSelect;
export type NewCommentMention = typeof commentMentions.$inferInsert;