CREATE TABLE "match_statistic_types" (
	"name" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	"target_entity_type" "entity_type" NOT NULL
);
--> statement-breakpoint
INSERT INTO "match_statistic_types" ("name", "display_name", "description", "target_entity_type") VALUES
	('player_runs_scored', 'Runs Scored', 'Runs scored by batter', 'player'),
	('player_balls_faced', 'Balls Faced', 'Legal balls faced by batter', 'player'),
	('player_got_out', 'Got Out', 'Whether player was dismissed (1=true, 0=false)', 'player'),
	('player_wickets_taken', 'Wickets Taken', 'Wickets taken by bowler', 'player'),
	('player_balls_bowled', 'Balls Bowled', 'Deliveries bowled by bowler', 'player'),
	('player_runs_conceded', 'Runs Conceded', 'Runs conceded by bowler', 'player'),
	('venue_first_innings_score', 'First Innings Score', 'First innings total at venue', 'venue'),
	('venue_second_innings_score', 'Second Innings Score', 'Second innings total at venue', 'venue');
--> statement-breakpoint
ALTER TABLE "match_statistics" ADD CONSTRAINT "match_statistics_statistic_type_name_match_statistic_types_name_fk" FOREIGN KEY ("statistic_type_name") REFERENCES "public"."match_statistic_types"("name") ON DELETE no action ON UPDATE no action;
