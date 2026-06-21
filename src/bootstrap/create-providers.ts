import { join } from "path";
import {
    createMemoryDependencies,
    createPostgresDependencies,
} from "@/bootstrap/create-dependencies";
import { createCricsheetsProvider } from "@/contexts/ingestion/adapters/cricsheets/provider";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";
import {
    CricsheetPlayerEnrichmentLookup,
    loadCricsheetPlayerEnrichment,
} from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";
import { createS3Client } from "@/contexts/ingestion/infrastructure/aws/s3-client";
import { Provider, IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { StatisticsDependencies } from "@/bootstrap/create-dependencies";

export interface AppDependencies {
    dependencies: IngestionDependencies;
    statistics: StatisticsDependencies;
    counts?: () => { players: number; teams: number; venues: number; matches: number; matchStatistics: number };
    close?: () => Promise<void>;
}

export async function createAppDependencies(): Promise<AppDependencies> {
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

function createCricsheetsClient(): CricsheetsClient {
    if (!process.env.CRICSHEETS_BUCKET_NAME) {
        throw new Error("CRICSHEETS_BUCKET_NAME is required");
    }

    return new CricsheetsClient(createS3Client());
}

function createCricsheetsProviderFromDependencies(
    dependencies: IngestionDependencies,
    playerEnrichment: CricsheetPlayerEnrichmentLookup,
): Provider {
    const client = createCricsheetsClient();
    const mapper = new CricsheetsMatchMapper(playerEnrichment);
    return createCricsheetsProvider(dependencies, client, mapper);
}

export function createProviders(
    dependencies: IngestionDependencies,
    playerEnrichment: CricsheetPlayerEnrichmentLookup,
): Provider[] {
    return [
        createCricsheetsProviderFromDependencies(dependencies, playerEnrichment),
    ];
}

export function loadPlayerEnrichment(): {
    lookup: CricsheetPlayerEnrichmentLookup;
    path: string;
} {
    const path = process.env.PLAYER_ENRICHMENT_PATH
        ?? join(process.cwd(), "data", "cricsheet-player-enriched.json");

    return {
        lookup: loadCricsheetPlayerEnrichment(path),
        path,
    };
}
