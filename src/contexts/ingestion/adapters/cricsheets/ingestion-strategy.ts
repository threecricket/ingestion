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
        private readonly minStartDate: Date,
    ) {}

    public async getMatches(): Promise<Match[]> {
        const matchKeys = await this.matchSource.listMatchKeys();
        const total = matchKeys.length;
        console.log(`Found ${total} match file(s) to ingest`);

        const matches: Match[] = [];

        for (const [index, matchKey] of matchKeys.entries()) {
            const progress = `[${index + 1}/${total}]`;

            try {
                console.log(`${progress} Loading ${matchKey}...`);
                const matchObject = await this.matchSource.getMatch(matchKey);
                const command = this.mapper.toIngestCommand(
                    matchObject as Parameters<CricsheetsMatchMapper["toIngestCommand"]>[0],
                );

                if (command.startDate.getTime() < this.minStartDate.getTime()) {
                    console.log(
                        `${progress} Skipping ${matchKey}: starts ${command.startDate.toISOString().slice(0, 10)}`
                        + ` (before ${this.minStartDate.toISOString().slice(0, 10)})`,
                    );
                    continue;
                }

                const match = await this.ingestMatch.execute(command);
                matches.push(match);
                console.log(
                    `${progress} Ingested ${matchKey} -> ${match.getMatchId()} (${match.getMatchFormat()})`,
                );
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`${progress} Skipping ${matchKey}: ${message}`);
            }
        }

        return matches;
    }
}
