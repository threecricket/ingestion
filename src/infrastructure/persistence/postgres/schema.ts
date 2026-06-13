// Run migrations: DATABASE_URL=postgres://... npm run db:migrate

import {
    date,
    integer,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const entityTypeEnum = pgEnum("entity_type", ["player", "team", "venue", "match"]);
export const bowlingStyleEnum = pgEnum("bowling_style", ["fast", "medium", "spin", "off-spin", "leg-spin"]);
export const handednessEnum = pgEnum("handedness", ["right-hand", "left-hand"]);
export const matchFormatEnum = pgEnum("match_format", ["test", "odi", "t20"]);
export const resultTypeEnum = pgEnum("result_type", ["won", "lost", "tie", "no_result"]);
export const wicketTypeEnum = pgEnum("wicket_type", [
    "bowled",
    "caught",
    "lbw",
    "stump",
    "run_out",
    "hit_wicket",
    "obstructing",
]);

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

export const venues = pgTable("venues", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
});

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

export const teams = pgTable("teams", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    homeVenueId: uuid("home_venue_id")
        .notNull()
        .references(() => venues.id),
});

export const matches = pgTable("matches", {
    id: uuid("id").primaryKey(),
    venueId: uuid("venue_id")
        .notNull()
        .references(() => venues.id),
    team1Id: uuid("team1_id")
        .notNull()
        .references(() => teams.id),
    team2Id: uuid("team2_id")
        .notNull()
        .references(() => teams.id),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    resultType: resultTypeEnum("result_type").notNull(),
    subjectTeamId: uuid("subject_team_id").references(() => teams.id),
    format: matchFormatEnum("format").notNull(),
});

export const innings = pgTable(
    "innings",
    {
        matchId: uuid("match_id")
            .notNull()
            .references(() => matches.id, { onDelete: "cascade" }),
        inningNumber: integer("inning_number").notNull(),
        runs: integer("runs").notNull(),
        wickets: integer("wickets").notNull(),
        overs: integer("overs").notNull(),
        balls: integer("balls").notNull(),
        target: integer("target"),
        battingTeamId: uuid("batting_team_id")
            .notNull()
            .references(() => teams.id),
        bowlingTeamId: uuid("bowling_team_id")
            .notNull()
            .references(() => teams.id),
    },
    (table) => [
        primaryKey({ columns: [table.matchId, table.inningNumber] }),
    ],
);

export const balls = pgTable(
    "balls",
    {
        matchId: uuid("match_id")
            .notNull()
            .references(() => matches.id, { onDelete: "cascade" }),
        inningNumber: integer("inning_number").notNull(),
        ballNumber: integer("ball_number").notNull(),
        runs: integer("runs").notNull(),
        wickets: integer("wickets").notNull(),
        batterId: uuid("batter_id")
            .notNull()
            .references(() => players.id),
        batterRuns: integer("batter_runs").notNull(),
        batterBalls: integer("batter_balls").notNull(),
        bowlerId: uuid("bowler_id")
            .notNull()
            .references(() => players.id),
        bowlerRuns: integer("bowler_runs").notNull(),
        bowlerBalls: integer("bowler_balls").notNull(),
        bowlerWickets: integer("bowler_wickets").notNull(),
        nonStrikerId: uuid("non_striker_id")
            .notNull()
            .references(() => players.id),
        nonStrikerRuns: integer("non_striker_runs").notNull(),
        nonStrikerBalls: integer("non_striker_balls").notNull(),
        resultRuns: integer("result_runs").notNull(),
        resultOut: integer("result_out").notNull(),
        resultExtras: integer("result_extras").notNull(),
        resultWide: integer("result_wide").notNull(),
        resultNoBall: integer("result_no_ball").notNull(),
        playerOutId: uuid("player_out_id").references(() => players.id),
        wicketType: wicketTypeEnum("wicket_type"),
    },
    (table) => [
        primaryKey({ columns: [table.matchId, table.inningNumber, table.ballNumber] }),
    ],
);
