import { readFileSync } from "fs";
import { join } from "path";
import "@/config/load-env";
import { createCricsheetsProvider } from "@/contexts/ingestion/adapters/cricsheets/provider";
import { loadCricsheetPlayerEnrichment } from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { Match } from "@/contexts/match/domain/models/match";
import { IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { createMemoryDependencies, createPostgresDependencies } from "@/bootstrap/create-dependencies";

interface AppDependencies {
    dependencies: IngestionDependencies;
    counts?: () => { players: number; teams: number; venues: number; matches: number };
    close?: () => Promise<void>;
}

async function createDependencies(): Promise<AppDependencies> {
    const persistence = process.env.PERSISTENCE ?? "memory";

    if (persistence === "postgres") {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL is required when PERSISTENCE=postgres");
        }

        return createPostgresDependencies(databaseUrl);
    }

    return createMemoryDependencies();
}

function createLocalCricsheetsClient(matchPath: string): CricsheetsClient {
    const matchData = JSON.parse(readFileSync(matchPath, "utf8"));

    return {
        getMatchObjects: async () => [matchPath],
        getMatch: async () => matchData,
    } as unknown as CricsheetsClient;
}

function printMatchSummary(match: Match): void {
    const result = match.getMatchResult();

    console.log(`Match ID:      ${match.getMatchId()}`);
    console.log(`Format:        ${match.getMatchFormat()}`);
    console.log(`Start date:    ${match.getMatchStartDate().toISOString().slice(0, 10)}`);
    console.log(`End date:      ${match.getMatchEndDate().toISOString().slice(0, 10)}`);
    console.log(`Venue ID:      ${match.getMatchVenueId()}`);
    console.log(`Team 1 ID:     ${match.getMatchTeam1Id()}`);
    console.log(`Team 2 ID:     ${match.getMatchTeam2Id()}`);
    console.log(`Result:        ${result.getResultType()}${result.getSubjectTeamId() ? ` (${result.getSubjectTeamId()})` : ""}`);
    console.log(`Innings:       ${match.getInnings().length}`);

    for (const inning of match.getInnings()) {
        console.log(
            `  Inning ${inning.getInningNumber()}: ${inning.getInningRuns()}/${inning.getInningWickets()}`
            + ` in ${inning.getInningOvers()}.${inning.getInningBalls()} overs`
            + `, target=${inning.getTarget() ?? "n/a"}`
            + `, deliveries=${inning.getBallList().length}`,
        );
    }
}

async function main(): Promise<void> {
    const matchPath = join(process.cwd(), "cricsheets.json");
    const enrichmentPath = join(process.cwd(), "data", "cricsheet-player-enriched.json");
    const playerEnrichment = loadCricsheetPlayerEnrichment(enrichmentPath);
    const { dependencies, counts, close } = await createDependencies();
    const client = createLocalCricsheetsClient(matchPath);
    const mapper = new CricsheetsMatchMapper(playerEnrichment);
    const provider = createCricsheetsProvider(dependencies, client, mapper);

    try {
        console.log(`Loaded ${playerEnrichment.size()} enriched players from ${enrichmentPath}`);
        console.log(`Ingesting ${matchPath} ...\n`);
        const matches = await provider.getMatches();

        if (matches.length === 0) {
            console.log("No matches ingested.");
            return;
        }

        for (const match of matches) {
            printMatchSummary(match);
            console.log();
        }

        if (counts) {
            const entityCounts = counts();
            console.log("Registered entities:");
            console.log(`  Players: ${entityCounts.players}`);
            console.log(`  Teams:   ${entityCounts.teams}`);
            console.log(`  Venues:  ${entityCounts.venues}`);
            console.log(`  Matches: ${entityCounts.matches}`);
        }
    } finally {
        if (close) {
            await close();
        }
    }
}

main().catch((error: unknown) => {
    console.error("Cricsheets ingestion test failed:", error);
    process.exit(1);
});
