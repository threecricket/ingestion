import { doublePrecision, pgEnum, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { entityTypeEnum } from "@/shared/identity/infrastructure/persistence/postgres/schema";
import { matches } from "@/contexts/match/infrastructure/postgres/schema";
import { players } from "@/contexts/player/infrastructure/postgres/schema";

export const matchStatisticTypes = pgTable("match_statistic_types", {
    name: text("name").primaryKey(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull(),
    targetEntityType: entityTypeEnum("target_entity_type").notNull(),
});

export const matchStatistics = pgTable(
    "match_statistics",
    {
        matchId: uuid("match_id")
            .notNull()
            .references(() => matches.id, { onDelete: "cascade" }),
        statisticTypeName: text("statistic_type_name")
            .notNull()
            .references(() => matchStatisticTypes.name),
        entityType: entityTypeEnum("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),
        value: doublePrecision("value").notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.matchId, table.statisticTypeName, table.entityId] }),
    ],
);

export const playerRatingKindEnum = pgEnum("player_rating_kind", ["sub", "overall"]);

export const playerRatingTypes = pgTable("player_rating_types", {
    name: text("name").primaryKey(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull(),
    kind: playerRatingKindEnum("kind").notNull(),
});

export const playerRatings = pgTable(
    "player_ratings",
    {
        playerId: uuid("player_id")
            .notNull()
            .references(() => players.id, { onDelete: "cascade" }),
        ratingName: text("rating_name")
            .notNull()
            .references(() => playerRatingTypes.name),
        value: doublePrecision("value").notNull(),
        normsVersion: text("norms_version"),
    },
    (table) => [
        primaryKey({ columns: [table.playerId, table.ratingName] }),
    ],
);
