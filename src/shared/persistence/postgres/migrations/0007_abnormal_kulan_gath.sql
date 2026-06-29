CREATE TYPE "public"."player_rating_kind" AS ENUM('sub', 'overall');--> statement-breakpoint
CREATE TABLE "player_rating_types" (
	"name" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	"kind" "player_rating_kind" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_ratings" (
	"player_id" uuid NOT NULL,
	"rating_name" text NOT NULL,
	"value" double precision NOT NULL,
	"norms_version" text,
	CONSTRAINT "player_ratings_player_id_rating_name_pk" PRIMARY KEY("player_id","rating_name")
);
--> statement-breakpoint
ALTER TABLE "match_statistics" ALTER COLUMN "value" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_rating_name_player_rating_types_name_fk" FOREIGN KEY ("rating_name") REFERENCES "public"."player_rating_types"("name") ON DELETE no action ON UPDATE no action;