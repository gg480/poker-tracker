DROP INDEX `player_settlements_unique_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_settlements_unique_idx` ON `player_settlements` (`player`,`season_id`);