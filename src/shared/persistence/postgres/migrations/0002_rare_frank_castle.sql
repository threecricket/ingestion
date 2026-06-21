ALTER TABLE "balls" ADD COLUMN "delivery_sequence" integer;--> statement-breakpoint
ALTER TABLE "balls" DROP CONSTRAINT "balls_match_id_inning_number_ball_number_pk";--> statement-breakpoint
UPDATE "balls" SET "delivery_sequence" = "ball_number" WHERE "delivery_sequence" IS NULL;--> statement-breakpoint
ALTER TABLE "balls" ALTER COLUMN "delivery_sequence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_match_id_inning_number_delivery_sequence_pk" PRIMARY KEY("match_id","inning_number","delivery_sequence");
