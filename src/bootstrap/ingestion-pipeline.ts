import { Match } from "@/contexts/match/domain/models/match";
import { Provider } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { PerformanceGateway } from "@/contexts/statistic/domain/ports/performance-gateway";
import { StatisticsDependencies } from "@/bootstrap/create-dependencies";
import {
    AppDependencies,
    createAppDependencies,
    createProviders,
    loadPlayerEnrichment,
} from "@/bootstrap/create-providers";
import { resolveMinStartDate } from "@/config/ingestion-config";

const CATALOGUE_POLL_INTERVAL_MS = 2000;
const DEFAULT_CATALOGUE_POLL_TIMEOUT_SECONDS = 120;

export interface ProviderIngestionResult {
    providerId: string;
    matches: Match[];
}

export interface IngestionPipelineResult {
    enrichmentPath: string;
    enrichedPlayerCount: number;
    providerResults: ProviderIngestionResult[];
    statisticsComputed: number;
    ratingsComputed: number;
    ratingNormsVersion: string | null;
    counts?: AppDependencies["counts"];
}

export interface IngestionPipeline {
    providers: Provider[];
    result: IngestionPipelineResult;
    close?: () => Promise<void>;
}

export type StartPhase = "ingest" | "ratings";

export interface RunIngestionPipelineOptions {
    startFrom?: StartPhase;
}

type RatingsTarget =
    | { mode: "matches"; matches: Match[] }
    | { mode: "all" };

async function runProviders(providers: Provider[]): Promise<ProviderIngestionResult[]> {
    const results: ProviderIngestionResult[] = [];

    for (const provider of providers) {
        console.log(`\nProvider: ${provider.getProviderId()}`);
        const matches = await provider.getMatches();
        results.push({
            providerId: provider.getProviderId(),
            matches,
        });
        console.log(`Provider ${provider.getProviderId()} finished: ${matches.length} match(es) ingested`);
    }

    return results;
}

async function runMatchStatistics(
    statistics: StatisticsDependencies,
    providerResults: ProviderIngestionResult[],
): Promise<number> {
    const matches = providerResults.flatMap(({ matches }) => matches);
    const total = matches.length;
    let statisticsComputed = 0;

    if (total === 0) {
        return statisticsComputed;
    }

    for (const [index, match] of matches.entries()) {
        const progress = `[${index + 1}/${total}]`;
        console.log(
            `${progress} Computing statistics for match ${match.getMatchId()} (${match.getMatchFormat()})...`,
        );
        const computed = await statistics.computeMatchStatistic.computeAllForMatch(match);
        statisticsComputed += computed.length;
        console.log(`${progress} Stored ${computed.length} statistic(s)`);
    }

    return statisticsComputed;
}

function collectPlayerIds(matches: Match[]): string[] {
    const ids = new Set<string>();

    for (const match of matches) {
        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                ids.add(ball.getBatterId());
                ids.add(ball.getBowlerId());
                ids.add(ball.getNonStrikerId());
            }
        }
    }

    return [...ids];
}

function getCataloguePollTimeoutSeconds(): number {
    const raw = process.env.CATALOGUE_POLL_TIMEOUT_SECONDS?.trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CATALOGUE_POLL_TIMEOUT_SECONDS;
}

async function delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRatingNormsVersion(
    gateway: PerformanceGateway,
    expectedVersion: string,
    timeoutSeconds: number,
): Promise<boolean> {
    const deadline = Date.now() + timeoutSeconds * 1000;

    while (Date.now() < deadline) {
        const catalogue = await gateway.getCatalogue();
        console.log(catalogue)
        if (catalogue.ratingNormsVersion === expectedVersion) {
            return true;
        }
        await delay(CATALOGUE_POLL_INTERVAL_MS);
    }

    return false;
}

async function runPlayerRatings(
    statistics: StatisticsDependencies,
    target: RatingsTarget,
): Promise<{ ratingsComputed: number; ratingNormsVersion: string | null }> {
    if (!statistics.publishRatingNorms || !statistics.computePlayerRatings) {
        if (target.mode === "all") {
            throw new Error(
                "Cannot start from the player-ratings phase: rating-norms output and a postgres-backed"
                + " player-statistics query repository are required (set RATING_NORMS_PATH/RATING_NORMS_S3_URI"
                + " and PERSISTENCE=postgres).",
            );
        }
        console.log("\nSkipping player ratings (rating-norms output not configured).");
        return { ratingsComputed: 0, ratingNormsVersion: null };
    }

    if (target.mode === "matches" && target.matches.length === 0) {
        return { ratingsComputed: 0, ratingNormsVersion: null };
    }

    console.log("\nPublishing rating norms...");
    const published = await statistics.publishRatingNorms.execute();
    console.log(
        `Published rating norms ${published.version}`
        + ` (${published.distributionCount} distribution(s) across ${published.formatCount} format(s))`,
    );

    console.log("Waiting for performance-api to load published rating norms...");
    const ready = await waitForRatingNormsVersion(
        statistics.performanceGateway,
        published.version,
        getCataloguePollTimeoutSeconds(),
    );

    if (!ready) {
        console.warn(
            `performance-api did not report rating-norms version ${published.version} in time; skipping ratings.`,
        );
        return { ratingsComputed: 0, ratingNormsVersion: published.version };
    }

    let ratingsComputed: number;
    if (target.mode === "all") {
        console.log("Computing ratings for all players with stored statistics...");
        ratingsComputed = await statistics.computePlayerRatings.computeForAllPlayers();
    } else {
        const playerIds = collectPlayerIds(target.matches);
        console.log(`Computing ratings for ${playerIds.length} player(s)...`);
        ratingsComputed = await statistics.computePlayerRatings.computeForPlayers(playerIds);
    }
    console.log(`Ratings complete: ${ratingsComputed} rating(s) computed`);

    return { ratingsComputed, ratingNormsVersion: published.version };
}

async function syncCatalogue(statistics: StatisticsDependencies): Promise<void> {
    console.log("\nSyncing catalogue from performance-api...");
    const catalogue = await statistics.syncCatalogue.execute();
    console.log(
        `Catalogue synced: ${catalogue.matchStatisticTypes} statistic type(s),`
        + ` ${catalogue.playerRatingTypes} rating type(s)`,
    );
}

async function runRatingsOnlyPipeline(): Promise<IngestionPipeline> {
    console.log("Starting from the player-ratings phase (skipping match ingestion + statistics).");

    console.log("Initializing persistence and dependencies...");
    const { statistics, counts, close } = await createAppDependencies();

    await syncCatalogue(statistics);

    const { ratingsComputed, ratingNormsVersion } = await runPlayerRatings(statistics, { mode: "all" });

    return {
        providers: [],
        result: {
            enrichmentPath: "",
            enrichedPlayerCount: 0,
            providerResults: [],
            statisticsComputed: 0,
            ratingsComputed,
            ratingNormsVersion,
            counts,
        },
        close,
    };
}

export async function runIngestionPipeline(
    options: RunIngestionPipelineOptions = {},
): Promise<IngestionPipeline> {
    if (options.startFrom === "ratings") {
        return runRatingsOnlyPipeline();
    }

    const { lookup: playerEnrichment, path: enrichmentPath } = loadPlayerEnrichment();
    console.log(`Loaded ${playerEnrichment.size()} enriched players from ${enrichmentPath}`);

    console.log("Initializing persistence and dependencies...");
    const { dependencies, statistics, counts, close } = await createAppDependencies();

    await syncCatalogue(statistics);

    const minStartDate = resolveMinStartDate();
    console.log(`Ingesting matches on or after ${minStartDate.toISOString().slice(0, 10)}`);

    const providers = createProviders(dependencies, playerEnrichment, minStartDate);
    console.log(`Starting ${providers.length} ingestion provider(s)...`);

    const providerResults = await runProviders(providers);

    const totalMatches = providerResults.reduce((sum, result) => sum + result.matches.length, 0);
    console.log(`\nMatch ingestion complete: ${totalMatches} match(es) across ${providerResults.length} provider(s)`);

    console.log("\nComputing match statistics...");
    const statisticsComputed = await runMatchStatistics(statistics, providerResults);
    console.log(`Statistics complete: ${statisticsComputed} value(s) computed`);

    const allMatches = providerResults.flatMap(({ matches }) => matches);
    const { ratingsComputed, ratingNormsVersion } = await runPlayerRatings(statistics, {
        mode: "matches",
        matches: allMatches,
    });

    return {
        providers,
        result: {
            enrichmentPath,
            enrichedPlayerCount: playerEnrichment.size(),
            providerResults,
            statisticsComputed,
            ratingsComputed,
            ratingNormsVersion,
            counts,
        },
        close,
    };
}
