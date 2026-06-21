CREATE TABLE "match_statistics" (
	"match_id" uuid NOT NULL,
	"statistic_type_name" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "match_statistics_match_id_statistic_type_name_entity_id_pk" PRIMARY KEY("match_id","statistic_type_name","entity_id")
);
--> statement-breakpoint
ALTER TABLE "match_statistics" ADD CONSTRAINT "match_statistics_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;