CREATE TABLE `bill_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` integer NOT NULL,
	`product_name_snapshot` text NOT NULL,
	`unit_price_rupee_snapshot` integer NOT NULL,
	`include_in_kot_snapshot` integer DEFAULT false NOT NULL,
	`line_total_rupee` integer NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`order_type` text NOT NULL,
	`table_id` integer,
	`payment_method` text,
	`discount_type` text DEFAULT 'none' NOT NULL,
	`discount_value` integer DEFAULT 0 NOT NULL,
	`discount_rupee` integer DEFAULT 0 NOT NULL,
	`subtotal_rupee` integer DEFAULT 0 NOT NULL,
	`total_rupee` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`table_id`) REFERENCES `dining_tables`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_bill_number_idx` ON `bills` (`bill_number`);--> statement-breakpoint
CREATE TABLE `business_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`shop_name` text DEFAULT 'My Restaurant' NOT NULL,
	`owner_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`gst_number` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dining_tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`max_stock` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `printer_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`header_text` text DEFAULT 'Thank you!' NOT NULL,
	`footer_text` text DEFAULT 'Visit again' NOT NULL,
	`paper_width` text DEFAULT '80mm' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`price_rupee` integer NOT NULL,
	`include_in_kot` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
