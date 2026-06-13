import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const venues = pgTable("venues", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
});
