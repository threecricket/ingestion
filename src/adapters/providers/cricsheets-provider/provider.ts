import { Provider, ProviderDependencies } from "@/domain/provider/models/provider";
import { CricsheetsMatchIngestionStrategy } from "./ingestion-strategy";
import { CricsheetsClient } from "./client";
import { CricsheetPlayerEnrichmentLookup } from "./player-enrichment";

export const createCricsheetsProvider = (
    dependencies: ProviderDependencies,
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
}
