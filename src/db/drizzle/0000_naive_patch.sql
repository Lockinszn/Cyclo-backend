CREATE TABLE `bookmarks` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`notes` text,
	`is_private` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_shares` (
	`id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`user_id` varchar(128),
	`platform` enum('twitter','facebook','linkedin','reddit','email','copy_link','other') NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`activity_type` enum('post_created','post_updated','post_deleted','post_published','comment_created','comment_updated','comment_deleted','post_liked','post_unliked','comment_liked','comment_unliked','post_bookmarked','post_unbookmarked','post_shared','user_followed','user_unfollowed','profile_updated','login','logout') NOT NULL,
	`target_type` enum('post','comment','user','bookmark'),
	`target_id` varchar(128),
	`metadata` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`email_notifications` boolean DEFAULT true,
	`in_app_notifications` boolean DEFAULT true,
	`comment_notifications` boolean DEFAULT true,
	`like_notifications` boolean DEFAULT true,
	`follow_notifications` boolean DEFAULT true,
	`mention_notifications` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `comment_flags` (
	`id` varchar(128) NOT NULL,
	`comment_id` varchar(128) NOT NULL,
	`reporter_id` varchar(128) NOT NULL,
	`reason` enum('spam','harassment','inappropriate','off_topic','misinformation','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
	`reviewed_by` varchar(128),
	`reviewed_at` timestamp,
	`review_notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comment_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`id` varchar(128) NOT NULL,
	`comment_id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comment_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_mentions` (
	`id` varchar(128) NOT NULL,
	`comment_id` varchar(128) NOT NULL,
	`mentioned_user_id` varchar(128) NOT NULL,
	`mentioned_by_user_id` varchar(128) NOT NULL,
	`is_notified` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comment_mentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_revisions` (
	`id` varchar(128) NOT NULL,
	`comment_id` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`revision_number` int NOT NULL,
	`edit_reason` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comment_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`author_id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`parent_id` varchar(128),
	`root_id` varchar(128),
	`depth` int DEFAULT 0,
	`status` enum('published','pending','approved','rejected','spam','deleted') DEFAULT 'published',
	`moderated_by` varchar(128),
	`moderated_at` timestamp,
	`moderation_reason` text,
	`likes_count` int DEFAULT 0,
	`replies_count` int DEFAULT 0,
	`is_edited` boolean DEFAULT false,
	`edited_at` timestamp,
	`is_flagged` boolean DEFAULT false,
	`flags_count` int DEFAULT 0,
	`author_name` varchar(100),
	`author_avatar` varchar(500),
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email_verification_token` varchar(255),
	`email_verification_expires` timestamp,
	`password_reset_token` varchar(255),
	`password_reset_expires` timestamp,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` varchar(128) NOT NULL,
	`follower_id` varchar(128) NOT NULL,
	`following_id` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(50) NOT NULL,
	`display_username` varchar(50) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`bio` text,
	`avatar` varchar(500),
	`website` varchar(255),
	`location` varchar(100),
	`role` enum('user','admin','moderator') DEFAULT 'user',
	`is_email_verified` boolean DEFAULT false,
	`is_banned` boolean DEFAULT false,
	`ban_reason` text,
	`last_login_at` timestamp,
	`posts_count` int DEFAULT 0,
	`followers_count` int DEFAULT 0,
	`following_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_display_username_unique` UNIQUE(`display_username`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`posts_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_revisions` (
	`id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`revision_number` int NOT NULL,
	`created_by` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`tag_id` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_views` (
	`id` varchar(128) NOT NULL,
	`post_id` varchar(128) NOT NULL,
	`user_id` varchar(128),
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` varchar(500),
	`viewed_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`featured_image` varchar(500),
	`author_id` varchar(128) NOT NULL,
	`category_id` varchar(128),
	`status` enum('draft','published','archived','pending_review') DEFAULT 'draft',
	`visibility` enum('public','private','unlisted') DEFAULT 'public',
	`meta_title` varchar(255),
	`meta_description` text,
	`meta_keywords` varchar(500),
	`canonical_url` varchar(500),
	`views_count` int DEFAULT 0,
	`likes_count` int DEFAULT 0,
	`comments_count` int DEFAULT 0,
	`bookmarks_count` int DEFAULT 0,
	`shares_count` int DEFAULT 0,
	`allow_comments` boolean DEFAULT true,
	`is_featured` boolean DEFAULT false,
	`is_pinned` boolean DEFAULT false,
	`reading_time` int DEFAULT 1,
	`content_blocks` json,
	`published_at` timestamp,
	`scheduled_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(128) NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`posts_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notification_queue` (
	`id` varchar(128) NOT NULL,
	`notification_id` varchar(128) NOT NULL,
	`channel` enum('in_app','email') NOT NULL,
	`status` enum('pending','processing','sent','failed','cancelled') DEFAULT 'pending',
	`attempts` int DEFAULT 0,
	`max_attempts` int DEFAULT 3,
	`scheduled_for` timestamp DEFAULT (now()),
	`processed_at` timestamp,
	`last_error` text,
	`error_count` int DEFAULT 0,
	`provider_data` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`enable_in_app` boolean DEFAULT true,
	`enable_email` boolean DEFAULT true,
	`comment_notifications` boolean DEFAULT true,
	`reply_notifications` boolean DEFAULT true,
	`mention_notifications` boolean DEFAULT true,
	`like_notifications` boolean DEFAULT true,
	`post_published_notifications` boolean DEFAULT true,
	`post_moderation_notifications` boolean DEFAULT true,
	`newsletter_notifications` boolean DEFAULT true,
	`weekly_digest_notifications` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_settings_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_templates` (
	`id` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` varchar(50) NOT NULL,
	`title_template` varchar(255) NOT NULL,
	`message_template` text NOT NULL,
	`email_subject_template` varchar(255),
	`email_body_template` text,
	`default_channels` json,
	`variables` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_templates_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(128) NOT NULL,
	`recipient_id` varchar(128) NOT NULL,
	`sender_id` varchar(128),
	`type` enum('comment','reply','mention','like','follow','bookmark','post_published','post_featured','post_approved','post_rejected','comment_approved','comment_rejected','account_verified','welcome','newsletter','weekly_digest') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`related_type` enum('post','comment','user','system'),
	`related_id` varchar(128),
	`metadata` json,
	`channels` json,
	`is_read` boolean DEFAULT false,
	`read_at` timestamp,
	`email_sent` boolean DEFAULT false,
	`email_sent_at` timestamp,
	`action_url` varchar(500),
	`action_text` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_activity` ADD CONSTRAINT `user_activity_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_flags` ADD CONSTRAINT `comment_flags_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_flags` ADD CONSTRAINT `comment_flags_reporter_id_users_id_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_flags` ADD CONSTRAINT `comment_flags_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_mentioned_user_id_users_id_fk` FOREIGN KEY (`mentioned_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_mentioned_by_user_id_users_id_fk` FOREIGN KEY (`mentioned_by_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_revisions` ADD CONSTRAINT `comment_revisions_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_comments_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_root_id_comments_id_fk` FOREIGN KEY (`root_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_moderated_by_users_id_fk` FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_follower_id_users_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_following_id_users_id_fk` FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_views` ADD CONSTRAINT `post_views_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_views` ADD CONSTRAINT `post_views_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_notification_id_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD CONSTRAINT `notification_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_id_users_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bookmarks_user_id_idx` ON `bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookmarks_post_id_idx` ON `bookmarks` (`post_id`);--> statement-breakpoint
CREATE INDEX `bookmarks_is_private_idx` ON `bookmarks` (`is_private`);--> statement-breakpoint
CREATE INDEX `bookmarks_created_at_idx` ON `bookmarks` (`created_at`);--> statement-breakpoint
CREATE INDEX `bookmarks_user_post_idx` ON `bookmarks` (`user_id`,`post_id`);--> statement-breakpoint
CREATE INDEX `bookmarks_user_private_idx` ON `bookmarks` (`user_id`,`is_private`);--> statement-breakpoint
CREATE INDEX `post_shares_post_id_idx` ON `post_shares` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_shares_user_id_idx` ON `post_shares` (`user_id`);--> statement-breakpoint
CREATE INDEX `post_shares_platform_idx` ON `post_shares` (`platform`);--> statement-breakpoint
CREATE INDEX `post_shares_created_at_idx` ON `post_shares` (`created_at`);--> statement-breakpoint
CREATE INDEX `post_shares_ip_address_idx` ON `post_shares` (`ip_address`);--> statement-breakpoint
CREATE INDEX `post_shares_post_platform_idx` ON `post_shares` (`post_id`,`platform`);--> statement-breakpoint
CREATE INDEX `user_activity_user_id_idx` ON `user_activity` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_activity_activity_type_idx` ON `user_activity` (`activity_type`);--> statement-breakpoint
CREATE INDEX `user_activity_target_type_idx` ON `user_activity` (`target_type`);--> statement-breakpoint
CREATE INDEX `user_activity_target_id_idx` ON `user_activity` (`target_id`);--> statement-breakpoint
CREATE INDEX `user_activity_created_at_idx` ON `user_activity` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_activity_user_created_idx` ON `user_activity` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `user_activity_type_created_idx` ON `user_activity` (`activity_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `user_activity_target_type_id_idx` ON `user_activity` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `user_preferences_user_id_idx` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_preferences_email_notifications_idx` ON `user_preferences` (`email_notifications`);--> statement-breakpoint
CREATE INDEX `user_preferences_in_app_notifications_idx` ON `user_preferences` (`in_app_notifications`);--> statement-breakpoint
CREATE INDEX `comment_flags_comment_id_idx` ON `comment_flags` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comment_flags_reporter_id_idx` ON `comment_flags` (`reporter_id`);--> statement-breakpoint
CREATE INDEX `comment_flags_status_idx` ON `comment_flags` (`status`);--> statement-breakpoint
CREATE INDEX `comment_flags_reason_idx` ON `comment_flags` (`reason`);--> statement-breakpoint
CREATE INDEX `comment_flags_reviewed_by_idx` ON `comment_flags` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `comment_flags_created_at_idx` ON `comment_flags` (`created_at`);--> statement-breakpoint
CREATE INDEX `comment_flags_status_created_idx` ON `comment_flags` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `comment_likes_comment_id_idx` ON `comment_likes` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comment_likes_user_id_idx` ON `comment_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `comment_likes_comment_user_idx` ON `comment_likes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `comment_likes_created_at_idx` ON `comment_likes` (`created_at`);--> statement-breakpoint
CREATE INDEX `comment_mentions_comment_id_idx` ON `comment_mentions` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comment_mentions_mentioned_user_id_idx` ON `comment_mentions` (`mentioned_user_id`);--> statement-breakpoint
CREATE INDEX `comment_mentions_mentioned_by_user_id_idx` ON `comment_mentions` (`mentioned_by_user_id`);--> statement-breakpoint
CREATE INDEX `comment_mentions_is_notified_idx` ON `comment_mentions` (`is_notified`);--> statement-breakpoint
CREATE INDEX `comment_mentions_created_at_idx` ON `comment_mentions` (`created_at`);--> statement-breakpoint
CREATE INDEX `comment_mentions_mentioned_notified_idx` ON `comment_mentions` (`mentioned_user_id`,`is_notified`);--> statement-breakpoint
CREATE INDEX `comment_revisions_comment_id_idx` ON `comment_revisions` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comment_revisions_revision_number_idx` ON `comment_revisions` (`revision_number`);--> statement-breakpoint
CREATE INDEX `comment_revisions_created_at_idx` ON `comment_revisions` (`created_at`);--> statement-breakpoint
CREATE INDEX `comment_revisions_comment_revision_idx` ON `comment_revisions` (`comment_id`,`revision_number`);--> statement-breakpoint
CREATE INDEX `comments_post_id_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `comments_author_id_idx` ON `comments` (`author_id`);--> statement-breakpoint
CREATE INDEX `comments_parent_id_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `comments_root_id_idx` ON `comments` (`root_id`);--> statement-breakpoint
CREATE INDEX `comments_depth_idx` ON `comments` (`depth`);--> statement-breakpoint
CREATE INDEX `comments_status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `comments_moderated_by_idx` ON `comments` (`moderated_by`);--> statement-breakpoint
CREATE INDEX `comments_is_flagged_idx` ON `comments` (`is_flagged`);--> statement-breakpoint
CREATE INDEX `comments_likes_count_idx` ON `comments` (`likes_count`);--> statement-breakpoint
CREATE INDEX `comments_created_at_idx` ON `comments` (`created_at`);--> statement-breakpoint
CREATE INDEX `comments_post_status_idx` ON `comments` (`post_id`,`status`);--> statement-breakpoint
CREATE INDEX `comments_post_created_idx` ON `comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_parent_depth_idx` ON `comments` (`parent_id`,`depth`);--> statement-breakpoint
CREATE INDEX `comments_author_status_idx` ON `comments` (`author_id`,`status`);--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `accounts_email_verification_token_idx` ON `accounts` (`email_verification_token`);--> statement-breakpoint
CREATE INDEX `accounts_password_reset_token_idx` ON `accounts` (`password_reset_token`);--> statement-breakpoint
CREATE INDEX `accounts_email_verification_expires_idx` ON `accounts` (`email_verification_expires`);--> statement-breakpoint
CREATE INDEX `accounts_password_reset_expires_idx` ON `accounts` (`password_reset_expires`);--> statement-breakpoint
CREATE INDEX `user_follows_following_id_idx` ON `user_follows` (`following_id`);--> statement-breakpoint
CREATE INDEX `user_follows_follower_id_idx` ON `user_follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `user_follows_follower_following_idx` ON `user_follows` (`follower_id`,`following_id`);--> statement-breakpoint
CREATE INDEX `user_follows_created_at_idx` ON `user_follows` (`created_at`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_banned_idx` ON `users` (`is_banned`);--> statement-breakpoint
CREATE INDEX `users_email_verified_idx` ON `users` (`is_email_verified`);--> statement-breakpoint
CREATE INDEX `users_posts_count_idx` ON `users` (`posts_count`);--> statement-breakpoint
CREATE INDEX `users_followers_count_idx` ON `users` (`followers_count`);--> statement-breakpoint
CREATE INDEX `users_last_login_idx` ON `users` (`last_login_at`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);--> statement-breakpoint
CREATE INDEX `users_active_idx` ON `users` (`is_banned`,`is_email_verified`);--> statement-breakpoint
CREATE INDEX `categories_is_active_idx` ON `categories` (`is_active`);--> statement-breakpoint
CREATE INDEX `categories_posts_count_idx` ON `categories` (`posts_count`);--> statement-breakpoint
CREATE INDEX `post_likes_post_id_idx` ON `post_likes` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_likes_user_id_idx` ON `post_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `post_likes_post_user_idx` ON `post_likes` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `post_likes_created_at_idx` ON `post_likes` (`created_at`);--> statement-breakpoint
CREATE INDEX `post_revisions_post_id_idx` ON `post_revisions` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_revisions_revision_number_idx` ON `post_revisions` (`revision_number`);--> statement-breakpoint
CREATE INDEX `post_revisions_created_by_idx` ON `post_revisions` (`created_by`);--> statement-breakpoint
CREATE INDEX `post_revisions_created_at_idx` ON `post_revisions` (`created_at`);--> statement-breakpoint
CREATE INDEX `post_revisions_post_revision_idx` ON `post_revisions` (`post_id`,`revision_number`);--> statement-breakpoint
CREATE INDEX `post_tags_post_id_idx` ON `post_tags` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_tags_tag_id_idx` ON `post_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `post_tags_post_tag_idx` ON `post_tags` (`post_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `post_views_post_id_idx` ON `post_views` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_views_user_id_idx` ON `post_views` (`user_id`);--> statement-breakpoint
CREATE INDEX `post_views_viewed_at_idx` ON `post_views` (`viewed_at`);--> statement-breakpoint
CREATE INDEX `post_views_ip_address_idx` ON `post_views` (`ip_address`);--> statement-breakpoint
CREATE INDEX `post_views_post_user_idx` ON `post_views` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `posts_title_idx` ON `posts` (`title`);--> statement-breakpoint
CREATE INDEX `posts_slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_author_id_idx` ON `posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `posts_category_id_idx` ON `posts` (`category_id`);--> statement-breakpoint
CREATE INDEX `posts_status_idx` ON `posts` (`status`);--> statement-breakpoint
CREATE INDEX `posts_visibility_idx` ON `posts` (`visibility`);--> statement-breakpoint
CREATE INDEX `posts_published_at_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `posts_scheduled_at_idx` ON `posts` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `posts_is_featured_idx` ON `posts` (`is_featured`);--> statement-breakpoint
CREATE INDEX `posts_is_pinned_idx` ON `posts` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `posts_views_count_idx` ON `posts` (`views_count`);--> statement-breakpoint
CREATE INDEX `posts_likes_count_idx` ON `posts` (`likes_count`);--> statement-breakpoint
CREATE INDEX `posts_comments_count_idx` ON `posts` (`comments_count`);--> statement-breakpoint
CREATE INDEX `posts_created_at_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `posts_status_visibility_idx` ON `posts` (`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `posts_author_status_idx` ON `posts` (`author_id`,`status`);--> statement-breakpoint
CREATE INDEX `posts_category_status_idx` ON `posts` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `posts_published_featured_idx` ON `posts` (`published_at`,`is_featured`);--> statement-breakpoint
CREATE INDEX `tags_posts_count_idx` ON `tags` (`posts_count`);--> statement-breakpoint
CREATE INDEX `tags_created_at_idx` ON `tags` (`created_at`);--> statement-breakpoint
CREATE INDEX `notification_queue_notification_id_idx` ON `notification_queue` (`notification_id`);--> statement-breakpoint
CREATE INDEX `notification_queue_channel_idx` ON `notification_queue` (`channel`);--> statement-breakpoint
CREATE INDEX `notification_queue_status_idx` ON `notification_queue` (`status`);--> statement-breakpoint
CREATE INDEX `notification_queue_scheduled_for_idx` ON `notification_queue` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `notification_queue_attempts_idx` ON `notification_queue` (`attempts`);--> statement-breakpoint
CREATE INDEX `notification_queue_status_scheduled_idx` ON `notification_queue` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `notification_queue_channel_status_idx` ON `notification_queue` (`channel`,`status`);--> statement-breakpoint
CREATE INDEX `notification_queue_status_attempts_idx` ON `notification_queue` (`status`,`attempts`);--> statement-breakpoint
CREATE INDEX `notification_settings_user_id_idx` ON `notification_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_settings_enable_email_idx` ON `notification_settings` (`enable_email`);--> statement-breakpoint
CREATE INDEX `notification_settings_enable_in_app_idx` ON `notification_settings` (`enable_in_app`);--> statement-breakpoint
CREATE INDEX `notification_templates_type_idx` ON `notification_templates` (`type`);--> statement-breakpoint
CREATE INDEX `notification_templates_is_active_idx` ON `notification_templates` (`is_active`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_id_idx` ON `notifications` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `notifications_sender_id_idx` ON `notifications` (`sender_id`);--> statement-breakpoint
CREATE INDEX `notifications_type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `notifications_is_read_idx` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_unread_idx` ON `notifications` (`recipient_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_created_idx` ON `notifications` (`recipient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_type_created_idx` ON `notifications` (`type`,`created_at`);