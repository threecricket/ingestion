import { MatchIngestionStrategy } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";
import { Match } from "@/contexts/match/domain/models/match";
import { CricsheetsMatchSource } from "@/contexts/ingestion/adapters/cricsheets/ports/cricsheets-match-source";
import { CricsheetsMatchMapper } from "@/contexts/ingestion/adapters/cricsheets/cricsheets-match-mapper";

export class CricsheetsMatchIngestionStrategy implements MatchIngestionStrategy {
    public constructor(
        private readonly ingestMatch: IngestMatchUseCase,
        private readonly matchSource: CricsheetsMatchSource,
        private readonly mapper: CricsheetsMatchMapper,
    ) {}

    public async getMatches(): Promise<Match[]> {
        const matchKeys = await this.matchSource.listMatchKeys();
        return Promise.all(matchKeys.map(async (matchKey) => {
            const matchObject = await this.matchSource.getMatch(matchKey);
            const command = this.mapper.toIngestCommand(
                matchObject as Parameters<CricsheetsMatchMapper["toIngestCommand"]>[0],
            );
            return this.ingestMatch.execute(command);
        }));
    }
}
