PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
	`session_id` text PRIMARY KEY NOT NULL,
	`postcode` text DEFAULT '2033' NOT NULL,
	`retailers` text DEFAULT '["coles","woolworths","aldi"]' NOT NULL,
	`pantry_items` text DEFAULT '["olive oil","garlic","salt"]' NOT NULL,
	`dietary_preferences` text DEFAULT '[]' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`alerts_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles`("session_id", "postcode", "retailers", "pantry_items", "dietary_preferences", "email", "alerts_enabled", "updated_at") SELECT "session_id", "postcode", "retailers", "pantry_items", "dietary_preferences", "email", "alerts_enabled", "updated_at" FROM `user_profiles`;--> statement-breakpoint
DROP TABLE `user_profiles`;--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;