import { readFileSync } from "fs";
import { join } from "path";
import "@/config/load-env";
import { createCricsheetsProvider } from "@/adapters/providers/cricsheets-provider/provider";
import { loadCricsheetPlayerEnrichment } from "@/adapters/providers/cricsheets-provider/player-enrichment";
import { CricsheetsClient } from "@/adapters/providers/cricsheets-provider/client";
import { Match } from "@/domain/match/models/match";
import { ProviderDependencies } from "@/domain/provider/models/provider";
import { createMemoryDependencies } from "@/infrastructure/persistence/memory/create-dependencies";
import { createPostgresDependencies } from "@/infrastructure/persistence/postgres/create-dependencies";

interface AppDependencies {
    dependencies: ProviderDependencies;
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
    const provider = createCricsheetsProvider(dependencies, client, playerEnrichment);

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
