import { Match } from "@/contexts/match/domain/models/match";
import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";

export interface IngestionDependencies {
    ingestMatch: IngestMatchUseCase;
}

export interface MatchIngestionStrategy {
    getMatches(): Promise<Match[]>;
}

export class Provider {
    private readonly providerId: string;
    private readonly strategy: MatchIngestionStrategy;

    private constructor(providerId: string, strategy: MatchIngestionStrategy) {
        this.providerId = providerId;
        this.strategy = strategy;
    }

    public static create(
        providerId: string,
        dependencies: IngestionDependencies,
        createStrategy: (dependencies: IngestionDependencies) => MatchIngestionStrategy,
    ): Provider {
        if (!providerId) {
            throw new Error("Invalid provider data");
        }
        return new Provider(providerId, createStrategy(dependencies));
    }

    public async getMatches(): Promise<Match[]> {
        return await this.strategy.getMatches();
    }

    public getProviderId(): string {
        return this.providerId;
    }
}
