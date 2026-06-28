import { Match } from "@/contexts/match/domain/models/match";
import { Provider } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { StatisticsDependencies } from "@/bootstrap/create-dependencies";
import {
    AppDependencies,
    createAppDependencies,
    createProviders,
    loadPlayerEnrichment,
} from "@/bootstrap/create-providers";

export interface ProviderIngestionResult {
    providerId: string;
    matches: Match[];
}

export interface IngestionPipelineResult {
    enrichmentPath: string;
    enrichedPlayerCount: number;
    providerResults: ProviderIngestionResult[];
    statisticsComputed: number;
    counts?: AppDependencies["counts"];
}

export interface IngestionPipeline {
    providers: Provider[];
    result: IngestionPipelineResult;
    close?: () => Promise<void>;
}

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

export async function runIngestionPipeline(): Promise<IngestionPipeline> {
    const { lookup: playerEnrichment, path: enrichmentPath } = loadPlayerEnrichment();
    console.log(`Loaded ${playerEnrichment.size()} enriched players from ${enrichmentPath}`);

    console.log("Initializing persistence and dependencies...");
    const { dependencies, statistics, counts, close } = await createAppDependencies();

    const providers = createProviders(dependencies, playerEnrichment);
    console.log(`Starting ${providers.length} ingestion provider(s)...`);

    const providerResults = await runProviders(providers);

    const totalMatches = providerResults.reduce((sum, result) => sum + result.matches.length, 0);
    console.log(`\nMatch ingestion complete: ${totalMatches} match(es) across ${providerResults.length} provider(s)`);

    console.log("\nPreparing statistic computers...");
    await statistics.computeMatchStatistic.prepareAll();

    console.log("\nComputing match statistics...");
    const statisticsComputed = await runMatchStatistics(statistics, providerResults);
    console.log(`Statistics complete: ${statisticsComputed} value(s) computed`);

    return {
        providers,
        result: {
            enrichmentPath,
            enrichedPlayerCount: playerEnrichment.size(),
            providerResults,
            statisticsComputed,
            counts,
        },
        close,
    };
}
