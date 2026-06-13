import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { venues } from "@/contexts/venue/infrastructure/postgres/schema";

export const teams = pgTable("teams", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    homeVenueId: uuid("home_venue_id")
        .notNull()
        .references(() => venues.id),
});
