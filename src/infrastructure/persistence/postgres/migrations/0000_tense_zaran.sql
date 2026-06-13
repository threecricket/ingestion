CREATE TYPE "public"."bowling_style" AS ENUM('fast', 'medium', 'spin', 'off-spin', 'leg-spin');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('player', 'team', 'venue', 'match');--> statement-breakpoint
CREATE TYPE "public"."handedness" AS ENUM('right-hand', 'left-hand');--> statement-breakpoint
CREATE TYPE "public"."match_format" AS ENUM('test', 'odi', 't20');--> statement-breakpoint
CREATE TYPE "public"."result_type" AS ENUM('won', 'lost', 'tie', 'no_result');--> statement-breakpoint
CREATE TYPE "public"."wicket_type" AS ENUM('bowled', 'caught', 'lbw', 'stump', 'run_out', 'hit_wicket', 'obstructing');--> statement-breakpoint
CREATE TABLE "balls" (
	"match_id" uuid NOT NULL,
	"inning_number" integer NOT NULL,
	"ball_number" integer NOT NULL,
	"runs" integer NOT NULL,
	"wickets" integer NOT NULL,
	"batter_id" uuid NOT NULL,
	"batter_runs" integer NOT NULL,
	"batter_balls" integer NOT NULL,
	"bowler_id" uuid NOT NULL,
	"bowler_runs" integer NOT NULL,
	"bowler_balls" integer NOT NULL,
	"bowler_wickets" integer NOT NULL,
	"non_striker_id" uuid NOT NULL,
	"non_striker_runs" integer NOT NULL,
	"non_striker_balls" integer NOT NULL,
	"result_runs" integer NOT NULL,
	"result_out" integer NOT NULL,
	"result_extras" integer NOT NULL,
	"result_wide" integer NOT NULL,
	"result_no_ball" integer NOT NULL,
	"player_out_id" uuid,
	"wicket_type" "wicket_type",
	CONSTRAINT "balls_match_id_inning_number_ball_number_pk" PRIMARY KEY("match_id","inning_number","ball_number")
);
--> statement-breakpoint
CREATE TABLE "canonical_identity_mappings" (
	"entity_type" "entity_type" NOT NULL,
	"fingerprint" text NOT NULL,
	"internal_id" uuid NOT NULL,
	CONSTRAINT "canonical_identity_mappings_entity_type_fingerprint_pk" PRIMARY KEY("entity_type","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "innings" (
	"match_id" uuid NOT NULL,
	"inning_number" integer NOT NULL,
	"runs" integer NOT NULL,
	"wickets" integer NOT NULL,
	"overs" integer NOT NULL,
	"balls" integer NOT NULL,
	"target" integer,
	"batting_team_id" uuid NOT NULL,
	"bowling_team_id" uuid NOT NULL,
	CONSTRAINT "innings_match_id_inning_number_pk" PRIMARY KEY("match_id","inning_number")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"team1_id" uuid NOT NULL,
	"team2_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"result_type" "result_type" NOT NULL,
	"subject_team_id" uuid,
	"format" "match_format" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"common_name" text,
	"batting_hand" "handedness",
	"bowling_hand" "handedness",
	"bowling_style" "bowling_style",
	"roles" text[],
	"country" text,
	"birth_date" date
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"home_venue_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_batter_id_players_id_fk" FOREIGN KEY ("batter_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowler_id_players_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_non_striker_id_players_id_fk" FOREIGN KEY ("non_striker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_player_out_id_players_id_fk" FOREIGN KEY ("player_out_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_batting_team_id_teams_id_fk" FOREIGN KEY ("batting_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_bowling_team_id_teams_id_fk" FOREIGN KEY ("bowling_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_id_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_id_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_subject_team_id_teams_id_fk" FOREIGN KEY ("subject_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_home_venue_id_venues_id_fk" FOREIGN KEY ("home_venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;