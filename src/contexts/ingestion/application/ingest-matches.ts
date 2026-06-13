import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";
import { IngestMatchCommand } from "@/contexts/match/application/ingest-match-command";
import { Match } from "@/contexts/match/domain/models/match";

export class IngestMatchesUseCase {
    public constructor(private readonly ingestMatch: IngestMatchUseCase) {}

    public async execute(command: IngestMatchCommand): Promise<Match> {
        return this.ingestMatch.execute(command);
    }
}
