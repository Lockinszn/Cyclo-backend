import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int, json } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users-schema';

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#6366f1'), // Default purple color
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true),
  postsCount: int('posts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#8b5cf6'), // Default purple variant
  postsCount: int('posts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = mysqlTable('posts', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  featuredImage: varchar('featured_image', { length: 500 }),
  authorId: varchar('author_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: varchar('category_id', { length: 128 }).references(() => categories.id, { onDelete: 'set null' }),
  status: mysqlEnum('status', ['draft', 'published', 'archived', 'pending_review']).default('draft'),
  visibility: mysqlEnum('visibility', ['public', 'private', 'unlisted']).default('public'),
  
  // SEO fields
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  metaKeywords: varchar('meta_keywords', { length: 500 }),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  
  // Engagement metrics
  viewsCount: int('views_count').default(0),
  likesCount: int('likes_count').default(0),
  commentsCount: int('comments_count').default(0),
  bookmarksCount: int('bookmarks_count').default(0),
  sharesCount: int('shares_count').default(0),
  
  // Content settings
  allowComments: boolean('allow_comments').default(true),
  isFeatured: boolean('is_featured').default(false),
  isPinned: boolean('is_pinned').default(false),
  
  // Reading time estimation (in minutes)
  readingTime: int('reading_time').default(1),
  
  // Content structure for rich editor
  contentBlocks: json('content_blocks'), // For storing structured content blocks
  
  // Publishing
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const postTags = mysqlTable('post_tags', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: varchar('tag_id', { length: 128 }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postViews = mysqlTable('post_views', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: varchar('referrer', { length: 500 }),
  viewedAt: timestamp('viewed_at').defaultNow(),
});

export const postLikes = mysqlTable('post_likes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postRevisions = mysqlTable('post_revisions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  revisionNumber: int('revision_number').notNull(),
  createdBy: varchar('created_by', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostTag = typeof postTags.$inferSelect;
export type NewPostTag = typeof postTags.$inferInsert;
export type PostView = typeof postViews.$inferSelect;
export type NewPostView = typeof postViews.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type PostRevision = typeof postRevisions.$inferSelect;
export type NewPostRevision = typeof postRevisions.$inferInsert;