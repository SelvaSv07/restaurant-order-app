ALTER TABLE `categories` ADD `icon_key` text DEFAULT 'Utensils' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `color_hex` text DEFAULT '#f97316' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `image_local_path` text;
