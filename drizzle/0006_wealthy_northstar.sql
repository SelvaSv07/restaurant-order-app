CREATE TABLE `cloud_sync_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`endpoint_base_url` text DEFAULT '' NOT NULL,
	`store_id` text DEFAULT '' NOT NULL,
	`sync_secret` text DEFAULT '' NOT NULL,
	`last_sync_at` integer,
	`last_error` text DEFAULT '' NOT NULL,
	`last_payload_version` integer DEFAULT 1 NOT NULL
);
