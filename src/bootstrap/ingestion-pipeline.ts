import { Match } from "@/contexts/match/domain/models/match";
import { Provider } from "@/contexts/ingestion/domain/ingestion-dependencies";
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

export async function runIngestionPipeline(): Promise<IngestionPipeline> {
    const { lookup: playerEnrichment, path: enrichmentPath } = loadPlayerEnrichment();
    const { dependencies, counts, close } = await createAppDependencies();
    const providers = createProviders(dependencies, playerEnrichment);
    const providerResults = await runProviders(providers);

    return {
        providers,
        result: {
            enrichmentPath,
            enrichedPlayerCount: playerEnrichment.size(),
            providerResults,
            counts,
        },
        close,
    };
}
