import { MatchIngestionStrategy } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";
import { Match } from "@/contexts/match/domain/models/match";
import { CricsheetsClient } from "@/contexts/ingestion/adapters/cricsheets/client";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";

export class CricsheetsMatchIngestionStrategy implements MatchIngestionStrategy {
    public constructor(
        private readonly ingestMatch: IngestMatchUseCase,
        private readonly client: CricsheetsClient,
        private readonly mapper: CricsheetsMatchMapper,
    ) {}

    public async getMatches(): Promise<Match[]> {
        const matchObjects = await this.client.getMatchObjects();
        return Promise.all(matchObjects.map(async (matchKey) => {
            const matchObject = await this.client.getMatch(matchKey);
            const command = this.mapper.toIngestCommand(matchObject);
            return this.ingestMatch.execute(command);
        }));
    }
}
