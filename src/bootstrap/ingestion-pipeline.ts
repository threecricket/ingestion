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
        const matches = await provider.getMatches();
        results.push({
            providerId: provider.getProviderId(),
            matches,
        });
    }

    return results;
}

async function runMatchStatistics(
    statistics: StatisticsDependencies,
    providerResults: ProviderIngestionResult[],
): Promise<number> {
    let statisticsComputed = 0;

    for (const { matches } of providerResults) {
        for (const match of matches) {
            const computed = await statistics.computeMatchStatistic.computeAllForMatch(match);
            statisticsComputed += computed.length;
        }
    }

    return statisticsComputed;
}

export async function runIngestionPipeline(): Promise<IngestionPipeline> {
    const { lookup: playerEnrichment, path: enrichmentPath } = loadPlayerEnrichment();
    const { dependencies, statistics, counts, close } = await createAppDependencies();
    const providers = createProviders(dependencies, playerEnrichment);
    const providerResults = await runProviders(providers);
    const statisticsComputed = await runMatchStatistics(statistics, providerResults);

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
