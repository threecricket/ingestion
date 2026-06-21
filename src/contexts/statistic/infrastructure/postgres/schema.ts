import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { entityTypeEnum } from "@/shared/identity/infrastructure/persistence/postgres/schema";
import { matches } from "@/contexts/match/infrastructure/postgres/schema";

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
        value: integer("value").notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.matchId, table.statisticTypeName, table.entityId] }),
    ],
);
