import { pgEnum, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

export const entityTypeEnum = pgEnum("entity_type", ["player", "team", "venue", "match"]);

export const canonicalIdentityMappings = pgTable(
    "canonical_identity_mappings",
    {
        entityType: entityTypeEnum("entity_type").notNull(),
        fingerprint: text("fingerprint").notNull(),
        internalId: uuid("internal_id").notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.entityType, table.fingerprint] }),
    ],
);
