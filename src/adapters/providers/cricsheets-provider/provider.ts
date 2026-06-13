import { Provider, ProviderDependencies } from "@/domain/provider/models/provider";
import { CricsheetsMatchIngestionStrategy } from "./ingestion-strategy";
import { CricsheetsClient } from "./client";

export const createCricsheetsProvider = (
    dependencies: ProviderDependencies,
    client: CricsheetsClient,
): Provider => {
    return Provider.create(
        "cricsheets",
        dependencies,
        (dependencies) => new CricsheetsMatchIngestionStrategy(dependencies, client),
    );
}
