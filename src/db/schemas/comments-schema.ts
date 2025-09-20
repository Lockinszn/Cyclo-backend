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
import { users } from "./users-schema";
import { posts } from "./posts-schema";

//@ts-ignore
export const comments = mysqlTable(
  "comments",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    content: text("content").notNull(),
    authorId: varchar("author_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: varchar("post_id", { length: 128 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),

    // For nested comments/replies
    parentId: varchar("parent_id", { length: 128 }).references(
      //@ts-ignore
      () => comments.id,
      { onDelete: "cascade" }
    ),
    rootId: varchar("root_id", { length: 128 }).references(() => comments.id, {
      onDelete: "cascade",
    }),
    depth: int("depth").default(0), // 0 for top-level comments, 1+ for replies

    // Moderation
    status: mysqlEnum("status", [
      "published",
      "pending",
      "approved",
      "rejected",
      "spam",
      "deleted",
    ]).default("published"),
    moderatedBy: varchar("moderated_by", { length: 128 }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    moderatedAt: timestamp("moderated_at"),
    moderationReason: text("moderation_reason"),

    // Engagement
    likesCount: int("likes_count").default(0),
    repliesCount: int("replies_count").default(0),

    // Flags and reports
    isEdited: boolean("is_edited").default(false),
    editedAt: timestamp("edited_at"),
    isFlagged: boolean("is_flagged").default(false),
    flagsCount: int("flags_count").default(0),

    // Author info at time of comment (for deleted users)
    authorName: varchar("author_name", { length: 100 }),
    authorAvatar: varchar("author_avatar", { length: 500 }),

    // IP tracking for moderation
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    // Index for getting comments of a post
    index("comments_post_id_idx").on(table.postId),
    // Index for getting comments by author
    index("comments_author_id_idx").on(table.authorId),
    // Index for nested comments (replies)
    index("comments_parent_id_idx").on(table.parentId),
    // Index for root comment threads
    index("comments_root_id_idx").on(table.rootId),
    // Index for comment depth (nested structure)
    index("comments_depth_idx").on(table.depth),
    // Index for comment status (moderation)
    index("comments_status_idx").on(table.status),
    // Index for moderated comments
    index("comments_moderated_by_idx").on(table.moderatedBy),
    // Index for flagged comments
    index("comments_is_flagged_idx").on(table.isFlagged),
    // Index for comment engagement
    index("comments_likes_count_idx").on(table.likesCount),
    // Index for comment timestamps
    index("comments_created_at_idx").on(table.createdAt),
    // Composite indexes for common queries
    index("comments_post_status_idx").on(table.postId, table.status),
    index("comments_post_created_idx").on(table.postId, table.createdAt),
    index("comments_parent_depth_idx").on(table.parentId, table.depth),
    index("comments_author_status_idx").on(table.authorId, table.status),
  ]
);

export const commentLikes = mysqlTable(
  "comment_likes",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    commentId: varchar("comment_id", { length: 128 })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Index for getting likes of a comment
    index("comment_likes_comment_id_idx").on(table.commentId),
    // Index for getting comments liked by a user
    index("comment_likes_user_id_idx").on(table.userId),
    // Composite index for checking if user liked a comment
    index("comment_likes_comment_user_idx").on(table.commentId, table.userId),
    // Index for recent likes
    index("comment_likes_created_at_idx").on(table.createdAt),
  ]
);

export const commentFlags = mysqlTable(
  "comment_flags",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    commentId: varchar("comment_id", { length: 128 })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    reporterId: varchar("reporter_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: mysqlEnum("reason", [
      "spam",
      "harassment",
      "inappropriate",
      "off_topic",
      "misinformation",
      "other",
    ]).notNull(),
    description: text("description"),
    status: mysqlEnum("status", [
      "pending",
      "reviewed",
      "resolved",
      "dismissed",
    ]).default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 128 }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Index for getting flags of a comment
    index("comment_flags_comment_id_idx").on(table.commentId),
    // Index for getting flags by reporter
    index("comment_flags_reporter_id_idx").on(table.reporterId),
    // Index for flag status (moderation queue)
    index("comment_flags_status_idx").on(table.status),
    // Index for flag reason
    index("comment_flags_reason_idx").on(table.reason),
    // Index for reviewed flags
    index("comment_flags_reviewed_by_idx").on(table.reviewedBy),
    // Index for flag timestamps
    index("comment_flags_created_at_idx").on(table.createdAt),
    // Composite index for moderation workflow
    index("comment_flags_status_created_idx").on(table.status, table.createdAt),
  ]
);

export const commentRevisions = mysqlTable(
  "comment_revisions",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    commentId: varchar("comment_id", { length: 128 })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    revisionNumber: int("revision_number").notNull(),
    editReason: varchar("edit_reason", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Index for getting revisions of a comment
    index("comment_revisions_comment_id_idx").on(table.commentId),
    // Index for revision ordering
    index("comment_revisions_revision_number_idx").on(table.revisionNumber),
    // Index for revision timestamps
    index("comment_revisions_created_at_idx").on(table.createdAt),
    // Composite index for comment revision history
    index("comment_revisions_comment_revision_idx").on(
      table.commentId,
      table.revisionNumber
    ),
  ]
);

// Mentions in comments
export const commentMentions = mysqlTable(
  "comment_mentions",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    commentId: varchar("comment_id", { length: 128 })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    mentionedUserId: varchar("mentioned_user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mentionedByUserId: varchar("mentioned_by_user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isNotified: boolean("is_notified").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Index for getting mentions in a comment
    index("comment_mentions_comment_id_idx").on(table.commentId),
    // Index for getting mentions of a user
    index("comment_mentions_mentioned_user_id_idx").on(table.mentionedUserId),
    // Index for getting mentions by a user
    index("comment_mentions_mentioned_by_user_id_idx").on(
      table.mentionedByUserId
    ),
    // Index for notification status
    index("comment_mentions_is_notified_idx").on(table.isNotified),
    // Index for mention timestamps
    index("comment_mentions_created_at_idx").on(table.createdAt),
    // Composite index for user mention notifications
    index("comment_mentions_mentioned_notified_idx").on(
      table.mentionedUserId,
      table.isNotified
    ),
  ]
);

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
