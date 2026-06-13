import { EntityResolver } from "@/domain/identity/services/entity-resolver";
import { IdentityHasherFactory } from "@/domain/identity/hashing/identity-hasher-factory";
import { Match } from "@/domain/match/models/match";
import { MatchRepository } from "@/domain/match/repositories/match-repository";
import { PlayerRepository } from "@/domain/player/repositories/player-repository";
import { TeamRepository } from "@/domain/team/repositories/team-repository";
import { VenueRepository } from "@/domain/venue/repositories/venue-repository";

export interface ProviderDependencies {
    entityResolver: EntityResolver;
    identityHasherFactory: IdentityHasherFactory;
    playerRepository: PlayerRepository;
    teamRepository: TeamRepository;
    venueRepository: VenueRepository;
    matchRepository: MatchRepository;
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
        dependencies: ProviderDependencies,
        createStrategy: (dependencies: ProviderDependencies) => MatchIngestionStrategy,
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
