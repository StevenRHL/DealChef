CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`retailer` text NOT NULL,
	`external_id` text NOT NULL,
	`name` text NOT NULL,
	`current_price` real NOT NULL,
	`was_price` real,
	`captured_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`session_id` text PRIMARY KEY NOT NULL,
	`postcode` text DEFAULT '2033' NOT NULL,
	`retailers` text DEFAULT '["coles","woolworths","aldi"]' NOT NULL,
	`pantry_items` text DEFAULT '["olive oil","garlic","salt"]' NOT NULL,
	`dietary_preferences` text DEFAULT '[]' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`alerts_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`deal_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`manual_seconds` text NOT NULL,
	`app_seconds` text NOT NULL,
	`created_at` text NOT NULL
);
