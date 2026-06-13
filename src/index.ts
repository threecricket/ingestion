import { readFileSync } from "fs";
import { join } from "path";
import "@/config/load-env";
import { createCricsheetsProvider } from "@/adapters/providers/cricsheets-provider/provider";
import { CricsheetsClient } from "@/adapters/providers/cricsheets-provider/client";
import { EntityResolver } from "@/domain/identity/services/entity-resolver";
import { IdentityHasherFactory } from "@/domain/identity/hashing/identity-hasher-factory";
import { Match } from "@/domain/match/models/match";
import { Player } from "@/domain/player/models/player";
import { Team } from "@/domain/team/models/team";
import { Venue } from "@/domain/venue/models/venue";
import { ProviderDependencies } from "@/domain/provider/models/provider";
import { InMemoryCanonicalMappingRepository } from "@/infrastructure/identity/in-memory-canonical-mapping-repository";
import { UuidIdGenerator } from "@/infrastructure/identity/uuid-id-generator";

function createInMemoryDependencies(): {
    dependencies: ProviderDependencies;
    counts: () => { players: number; teams: number; venues: number; matches: number };
} {
    const players = new Map<string, Player>();
    const teams = new Map<string, Team>();
    const venues = new Map<string, Venue>();
    const matches = new Map<string, Match>();
    const canonicalMappingRepository = new InMemoryCanonicalMappingRepository();
    const idGenerator = new UuidIdGenerator();
    const entityResolver = new EntityResolver(
        canonicalMappingRepository,
        idGenerator,
    );
    const identityHasherFactory = new IdentityHasherFactory();

    return {
        dependencies: {
            entityResolver,
            identityHasherFactory,
            playerRepository: {
                findById: (id) => players.get(id) ?? null,
                save: (player) => { players.set(player.getPlayerId(), player); },
            },
            teamRepository: {
                findById: (id) => teams.get(id) ?? null,
                save: (team) => { teams.set(team.getTeamId(), team); },
            },
            venueRepository: {
                findById: (id) => venues.get(id) ?? null,
                save: (venue) => { venues.set(venue.getVenueId(), venue); },
            },
            matchRepository: {
                findById: (id) => matches.get(id) ?? null,
                save: (match) => { matches.set(match.getMatchId(), match); },
            },
        },
        counts: () => ({
            players: players.size,
            teams: teams.size,
            venues: venues.size,
            matches: matches.size,
        }),
    };
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
    const { dependencies, counts } = createInMemoryDependencies();
    const client = createLocalCricsheetsClient(matchPath);
    const provider = createCricsheetsProvider(dependencies, client);

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

    const entityCounts = counts();
    console.log("Registered entities:");
    console.log(`  Players: ${entityCounts.players}`);
    console.log(`  Teams:   ${entityCounts.teams}`);
    console.log(`  Venues:  ${entityCounts.venues}`);
    console.log(`  Matches: ${entityCounts.matches}`);
}

main().catch((error: unknown) => {
    console.error("Cricsheets ingestion test failed:", error);
    process.exit(1);
});
