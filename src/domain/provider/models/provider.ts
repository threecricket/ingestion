import { Match } from "@/domain/match/models/match";
import { PlayerRepository } from "@/domain/player/repositories/player-repository";
import { TeamRepository } from "@/domain/team/repositories/team-repository";
import { VenueRepository } from "@/domain/venue/repositories/venue-repository";

export interface ProviderDependencies {
    playerRepository: PlayerRepository;
    teamRepository: TeamRepository;
    venueRepository: VenueRepository;
}

export interface MatchIngestionStrategy {
    getMatches(): Match[];
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
        dependencies: ProviderDependencies,
        createStrategy: (dependencies: ProviderDependencies) => MatchIngestionStrategy,
    ): Provider {
        if (!providerId) {
            throw new Error("Invalid provider data");
        }
        return new Provider(providerId, createStrategy(dependencies));
    }

    public getMatches(): Match[] {
        return this.strategy.getMatches();
    }

    public getProviderId(): string {
        return this.providerId;
    }
}
