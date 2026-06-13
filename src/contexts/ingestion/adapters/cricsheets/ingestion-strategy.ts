import { MatchIngestionStrategy, IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { IngestMatchesUseCase } from "@/contexts/ingestion/application/ingest-matches";
import { Match } from "@/contexts/match/domain/models/match";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";
import { CricsheetPlayerEnrichmentLookup } from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";

export class CricsheetsMatchIngestionStrategy implements MatchIngestionStrategy {
    private readonly ingestMatches: IngestMatchesUseCase;
    private readonly client: CricsheetsClient;
    private readonly mapper: CricsheetsMatchMapper;

    public constructor(
        dependencies: IngestionDependencies,
        client: CricsheetsClient,
        playerEnrichment: CricsheetPlayerEnrichmentLookup,
    ) {
        this.ingestMatches = new IngestMatchesUseCase(dependencies.ingestMatch);
        this.client = client;
        this.mapper = new CricsheetsMatchMapper(playerEnrichment);
    }

    public async getMatches(): Promise<Match[]> {
        const matchObjects = await this.client.getMatchObjects();
        return Promise.all(matchObjects.map(async (matchKey) => {
            const matchObject = await this.client.getMatch(matchKey);
            const command = this.mapper.toIngestCommand(matchObject);
            return this.ingestMatches.execute(command);
        }));
    }
}
