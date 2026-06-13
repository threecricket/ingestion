import { date, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const bowlingStyleEnum = pgEnum("bowling_style", ["fast", "medium", "spin", "off-spin", "leg-spin"]);
export const handednessEnum = pgEnum("handedness", ["right-hand", "left-hand"]);

export const players = pgTable("players", {
    id: uuid("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    commonName: text("common_name"),
    battingHand: handednessEnum("batting_hand"),
    bowlingHand: handednessEnum("bowling_hand"),
    bowlingStyle: bowlingStyleEnum("bowling_style"),
    roles: text("roles").array(),
    country: text("country"),
    birthDate: date("birth_date"),
});
