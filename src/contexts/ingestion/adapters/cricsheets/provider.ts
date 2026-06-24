import { Provider, IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { CricsheetsMatchIngestionStrategy } from "@/contexts/ingestion/adapters/cricsheets/ingestion-strategy";
import { CricsheetsMatchSource } from "@/contexts/ingestion/adapters/cricsheets/ports/cricsheets-match-source";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";

export const createCricsheetsProvider = (
    dependencies: IngestionDependencies,
    matchSource: CricsheetsMatchSource,
    mapper: CricsheetsMatchMapper,
): Provider => {
    return Provider.create(
        "cricsheets",
        dependencies,
        (dependencies) => new CricsheetsMatchIngestionStrategy(
            dependencies.ingestMatch,
            matchSource,
            mapper,
        ),
    );
};
