import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
});
