ALTER TABLE `inventory_items` ADD `category` text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `reorder_qty` integer DEFAULT 0 NOT NULL;
