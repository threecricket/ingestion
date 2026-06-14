import { Provider, IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { CricsheetsMatchIngestionStrategy } from "@/contexts/ingestion/adapters/cricsheets/ingestion-strategy";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";

export const createCricsheetsProvider = (
    dependencies: IngestionDependencies,
    client: CricsheetsClient,
    mapper: CricsheetsMatchMapper,
): Provider => {
    return Provider.create(
        "cricsheets",
        dependencies,
        (dependencies) => new CricsheetsMatchIngestionStrategy(
            dependencies.ingestMatch,
            client,
            mapper,
        ),
    );
};
