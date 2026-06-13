import { Provider, IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { CricsheetsMatchIngestionStrategy } from "@/contexts/ingestion/adapters/cricsheets/ingestion-strategy";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { CricsheetPlayerEnrichmentLookup } from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";

export const createCricsheetsProvider = (
    dependencies: IngestionDependencies,
    client: CricsheetsClient,
    playerEnrichment: CricsheetPlayerEnrichmentLookup,
): Provider => {
    return Provider.create(
        "cricsheets",
        dependencies,
        (dependencies) => new CricsheetsMatchIngestionStrategy(
            dependencies,
            client,
            playerEnrichment,
        ),
    );
};
