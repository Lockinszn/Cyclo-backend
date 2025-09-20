import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int, json, index } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users-schema';

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  postsCount: int('posts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ([
  // Index for active categories
  index('categories_is_active_idx').on(table.isActive),
  // Index for category popularity
  index('categories_posts_count_idx').on(table.postsCount),
]));

export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  postsCount: int('posts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for tag popularity
  index('tags_posts_count_idx').on(table.postsCount),
  // Index for tag creation date
  index('tags_created_at_idx').on(table.createdAt),
]));

export const posts = mysqlTable(
  "posts",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    featuredImage: varchar("featured_image", { length: 500 }),
    authorId: varchar("author_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: varchar("category_id", { length: 128 }).references(
      () => categories.id,
      { onDelete: "set null" }
    ),
    status: mysqlEnum("status", [
      "draft",
      "published",
      "archived",
      "pending_review",
    ]).default("draft"),
    visibility: mysqlEnum("visibility", [
      "public",
      "private",
      "unlisted",
    ]).default("public"),

    // SEO fields
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: varchar("meta_keywords", { length: 500 }),
    canonicalUrl: varchar("canonical_url", { length: 500 }),

    // Engagement metrics
    viewsCount: int("views_count").default(0),
    likesCount: int("likes_count").default(0),
    commentsCount: int("comments_count").default(0),
    bookmarksCount: int("bookmarks_count").default(0),
    sharesCount: int("shares_count").default(0),

    // Content settings
    allowComments: boolean("allow_comments").default(true),
    isFeatured: boolean("is_featured").default(false),
    isPinned: boolean("is_pinned").default(false),

    // Reading time estimation (in minutes)
    readingTime: int("reading_time").default(1),

    // Content structure for rich editor
    contentBlocks: json("content_blocks"), // For storing structured content blocks

    // Publishing
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ([
    index("posts_title_idx").on(table.title),
    index("posts_slug_idx").on(table.slug),

    // Index for author's posts
    index("posts_author_id_idx").on(table.authorId),
    // Index for category filtering
    index("posts_category_id_idx").on(table.categoryId),
    // Index for post status queries
    index("posts_status_idx").on(table.status),
    // Index for post visibility
    index("posts_visibility_idx").on(table.visibility),
    // Index for published posts
    index("posts_published_at_idx").on(table.publishedAt),
    // Index for scheduled posts
    index("posts_scheduled_at_idx").on(table.scheduledAt),
    // Index for featured posts
    index("posts_is_featured_idx").on(table.isFeatured),
    // Index for pinned posts
    index("posts_is_pinned_idx").on(table.isPinned),
    // Index for post engagement metrics
    index("posts_views_count_idx").on(table.viewsCount),
    index("posts_likes_count_idx").on(table.likesCount),
    index("posts_comments_count_idx").on(table.commentsCount),
    // Index for post creation date
    index("posts_created_at_idx").on(table.createdAt),
    // Composite indexes for common queries
    index("posts_status_visibility_idx").on(
      table.status,
      table.visibility
    ),
    index("posts_author_status_idx").on(
      table.authorId,
      table.status
    ),
    index("posts_category_status_idx").on(
      table.categoryId,
      table.status
    ),
    index("posts_published_featured_idx").on(
      table.publishedAt,
      table.isFeatured
    ),
  ])
);

export const postTags = mysqlTable('post_tags', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: varchar('tag_id', { length: 128 }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting tags of a post
  index('post_tags_post_id_idx').on(table.postId),
  // Index for getting posts with a specific tag
  index('post_tags_tag_id_idx').on(table.tagId),
  // Composite index for unique post-tag relationships
  index('post_tags_post_tag_idx').on(table.postId, table.tagId),
]));

export const postViews = mysqlTable('post_views', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: varchar('referrer', { length: 500 }),
  viewedAt: timestamp('viewed_at').defaultNow(),
}, (table) => ([
  // Index for post view analytics
  index('post_views_post_id_idx').on(table.postId),
  // Index for user view history
  index('post_views_user_id_idx').on(table.userId),
  // Index for view timestamps (analytics)
  index('post_views_viewed_at_idx').on(table.viewedAt),
  // Index for IP-based analytics
  index('post_views_ip_address_idx').on(table.ipAddress),
  // Composite index for unique views per user per post
  index('post_views_post_user_idx').on(table.postId, table.userId),
]));

export const postLikes = mysqlTable('post_likes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting likes of a post
  index('post_likes_post_id_idx').on(table.postId),
  // Index for getting posts liked by a user
  index('post_likes_user_id_idx').on(table.userId),
  // Composite index for checking if user liked a post
  index('post_likes_post_user_idx').on(table.postId, table.userId),
  // Index for recent likes (activity feeds)
  index('post_likes_created_at_idx').on(table.createdAt),
]));

export const postRevisions = mysqlTable('post_revisions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postId: varchar('post_id', { length: 128 }).notNull().references(() => posts.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  revisionNumber: int('revision_number').notNull(),
  createdBy: varchar('created_by', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  // Index for getting revisions of a post
  index('post_revisions_post_id_idx').on(table.postId),
  // Index for revision history ordering
  index('post_revisions_revision_number_idx').on(table.revisionNumber),
  // Index for revisions by author
  index('post_revisions_created_by_idx').on(table.createdBy),
  // Index for revision timestamps
  index('post_revisions_created_at_idx').on(table.createdAt),
  // Composite index for post revision ordering
  index('post_revisions_post_revision_idx').on(table.postId, table.revisionNumber),
]));

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