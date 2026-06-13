ALTER TABLE "teams" DROP CONSTRAINT "teams_home_venue_id_venues_id_fk";
--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "home_venue_id";