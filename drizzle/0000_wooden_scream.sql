CREATE TABLE `ai_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text(100) NOT NULL,
	`prompt` text NOT NULL,
	`result` text NOT NULL,
	`time` text(50) NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_cache_label_idx` ON `ai_cache` (`label`);--> statement-breakpoint
CREATE INDEX `ai_cache_created_idx` ON `ai_cache` (`created_at`);--> statement-breakpoint
CREATE TABLE `award_records` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`player` text(50) NOT NULL,
	`award_type` text(50) NOT NULL,
	`award_name` text(50) NOT NULL,
	`award_icon` text(30) NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `award_records_season_idx` ON `award_records` (`season_id`);--> statement-breakpoint
CREATE INDEX `award_records_player_idx` ON `award_records` (`player`);--> statement-breakpoint
CREATE INDEX `award_records_type_idx` ON `award_records` (`award_type`);--> statement-breakpoint
CREATE INDEX `award_records_season_type_idx` ON `award_records` (`season_id`,`award_type`);--> statement-breakpoint
CREATE INDEX `award_records_created_idx` ON `award_records` (`created_at`);--> statement-breakpoint
CREATE TABLE `clear_records` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text(10) NOT NULL,
	`player` text(50) NOT NULL,
	`amount` integer NOT NULL,
	`season_id` text NOT NULL,
	`clear_type` text(20) DEFAULT 'threshold' NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clear_records_player_idx` ON `clear_records` (`player`);--> statement-breakpoint
CREATE INDEX `clear_records_type_idx` ON `clear_records` (`clear_type`);--> statement-breakpoint
CREATE INDEX `clear_records_date_idx` ON `clear_records` (`date`);--> statement-breakpoint
CREATE INDEX `clear_records_season_player_idx` ON `clear_records` (`season_id`,`player`);--> statement-breakpoint
CREATE INDEX `clear_records_season_date_idx` ON `clear_records` (`season_id`,`date`);--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text(10) NOT NULL,
	`season_id` text NOT NULL,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`total_records` integer DEFAULT 0 NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_sessions_date_idx` ON `game_sessions` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_sessions_date_season_unique` ON `game_sessions` (`date`,`season_id`);--> statement-breakpoint
CREATE INDEX `game_sessions_status_idx` ON `game_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `game_sessions_season_date_idx` ON `game_sessions` (`season_id`,`date`);--> statement-breakpoint
CREATE TABLE `hand_records` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text(10) NOT NULL,
	`season_id` text NOT NULL,
	`session_id` text,
	`players` text NOT NULL,
	`hand_type` text(20),
	`board` text,
	`actions` text,
	`result` integer,
	`winner` text(50),
	`notes` text,
	`tags` text,
	`photo` text,
	`gto_analysis` text,
	`is_complete` integer DEFAULT false NOT NULL,
	`quick_mode` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hand_records_date_idx` ON `hand_records` (`date`);--> statement-breakpoint
CREATE INDEX `hand_records_season_idx` ON `hand_records` (`season_id`);--> statement-breakpoint
CREATE INDEX `hand_records_session_idx` ON `hand_records` (`session_id`);--> statement-breakpoint
CREATE INDEX `hand_records_complete_idx` ON `hand_records` (`is_complete`);--> statement-breakpoint
CREATE INDEX `hand_records_quick_idx` ON `hand_records` (`quick_mode`);--> statement-breakpoint
CREATE INDEX `hand_records_season_complete_idx` ON `hand_records` (`season_id`,`is_complete`);--> statement-breakpoint
CREATE INDEX `hand_records_session_created_idx` ON `hand_records` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `hand_records_complete_created_idx` ON `hand_records` (`is_complete`,`created_at`);--> statement-breakpoint
CREATE INDEX `hand_records_season_complete_created_idx` ON `hand_records` (`season_id`,`is_complete`,`created_at`);--> statement-breakpoint
CREATE TABLE `import_log` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`file_hash` text NOT NULL,
	`file_path` text NOT NULL,
	`record_count` integer DEFAULT 0 NOT NULL,
	`imported_at` text NOT NULL,
	`status` text(20) DEFAULT 'success' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_log_file_hash_unique` ON `import_log` (`file_hash`);--> statement-breakpoint
CREATE INDEX `import_log_hash_idx` ON `import_log` (`file_hash`);--> statement-breakpoint
CREATE INDEX `import_log_status_idx` ON `import_log` (`status`);--> statement-breakpoint
CREATE INDEX `import_log_imported_idx` ON `import_log` (`imported_at`);--> statement-breakpoint
CREATE TABLE `player_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`player` text(50) NOT NULL,
	`season_id` text NOT NULL,
	`settle_score` integer DEFAULT 0 NOT NULL,
	`season_adjust` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `player_settlements_season_player_idx` ON `player_settlements` (`season_id`,`player`);--> statement-breakpoint
CREATE INDEX `player_settlements_unique_idx` ON `player_settlements` (`player`,`season_id`);--> statement-breakpoint
CREATE TABLE `poker_records` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text(10) NOT NULL,
	`season_id` text NOT NULL,
	`session_id` text,
	`player` text(50) NOT NULL,
	`score` integer NOT NULL,
	`win` integer NOT NULL,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `poker_records_date_idx` ON `poker_records` (`date`);--> statement-breakpoint
CREATE INDEX `poker_records_player_idx` ON `poker_records` (`player`);--> statement-breakpoint
CREATE INDEX `poker_records_session_player_idx` ON `poker_records` (`session_id`,`player`);--> statement-breakpoint
CREATE INDEX `poker_records_status_idx` ON `poker_records` (`status`);--> statement-breakpoint
CREATE INDEX `poker_records_date_player_idx` ON `poker_records` (`date`,`player`);--> statement-breakpoint
CREATE INDEX `poker_records_season_player_idx` ON `poker_records` (`season_id`,`player`);--> statement-breakpoint
CREATE INDEX `poker_records_season_date_idx` ON `poker_records` (`season_id`,`date`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(50) NOT NULL,
	`start_date` text(10) NOT NULL,
	`end_date` text(10),
	`active` integer DEFAULT true NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seasons_name_unique` ON `seasons` (`name`);--> statement-breakpoint
CREATE INDEX `seasons_active_idx` ON `seasons` (`active`);--> statement-breakpoint
CREATE INDEX `seasons_date_range_idx` ON `seasons` (`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `seasons_active_start_date_idx` ON `seasons` (`active`,`start_date`);--> statement-breakpoint
CREATE TABLE `coach_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`hand_number` integer NOT NULL,
	`street` text(10) NOT NULL,
	`hole_cards` text NOT NULL,
	`board_cards` text DEFAULT '[]' NOT NULL,
	`pot_size` integer NOT NULL,
	`user_stack` integer NOT NULL,
	`opponent_stack` integer NOT NULL,
	`user_action` text(10) NOT NULL,
	`user_bet_amount` integer DEFAULT 0 NOT NULL,
	`opponent_action` text(10),
	`opponent_bet_amount` integer DEFAULT 0 NOT NULL,
	`gto_recommendation` text(10),
	`gto_frequency` real,
	`equity` real,
	`pot_odds` real,
	`ev` real,
	`is_correct` integer,
	`deviation` real,
	`result` text(10),
	`net_chips` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `coach_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coach_decisions_hand_created_idx` ON `coach_decisions` (`session_id`,`hand_number`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`decision_id` text NOT NULL,
	`feedback_type` text(20) NOT NULL,
	`message` text NOT NULL,
	`suggestion` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `coach_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decision_id`) REFERENCES `coach_decisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coach_feedback_session_created_idx` ON `coach_feedback` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `coach_feedback_decision_idx` ON `coach_feedback` (`decision_id`);--> statement-breakpoint
CREATE TABLE `coach_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text(20) DEFAULT 'cash' NOT NULL,
	`status` text(20) DEFAULT 'in_progress' NOT NULL,
	`starting_stack` integer DEFAULT 10000 NOT NULL,
	`blind_small` integer DEFAULT 50 NOT NULL,
	`blind_big` integer DEFAULT 100 NOT NULL,
	`opponent_style` text(20) DEFAULT 'gto' NOT NULL,
	`total_hands` integer DEFAULT 0 NOT NULL,
	`total_ev` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coach_sessions_status_created_idx` ON `coach_sessions` (`status`,`created_at`);