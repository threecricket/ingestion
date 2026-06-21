import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { FingerprintIdGenerator } from "@/shared/identity/infrastructure/fingerprint-id-generator";
import { InMemoryCanonicalMappingRepository } from "@/shared/identity/infrastructure/persistence/memory/canonical-mapping-repository";
import { PostgresCanonicalMappingRepository } from "@/shared/identity/infrastructure/persistence/postgres/canonical-mapping-repository";
import { createDatabaseClient } from "@/shared/persistence/postgres/client";
import { registerIdentityHashers } from "@/bootstrap/register-identity-hashers";
import { ResolveVenueUseCase } from "@/contexts/venue/application/resolve-venue";
import { ResolveTeamUseCase } from "@/contexts/team/application/resolve-team";
import { ResolvePlayerUseCase } from "@/contexts/player/application/resolve-player";
import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";
import { IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { ComputeMatchStatisticUseCase } from "@/contexts/statistic/application/compute-match-statistic";
import { MatchStatisticComputerRegistry } from "@/contexts/statistic/domain/statistics/match-statistic-registry";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repository/match-statistics-repository";
import { PostgresVenueRepository } from "@/contexts/venue/infrastructure/postgres/venue-repository";
import { PostgresPlayerRepository } from "@/contexts/player/infrastructure/postgres/player-repository";
import { PostgresTeamRepository } from "@/contexts/team/infrastructure/postgres/team-repository";
import { PostgresMatchRepository } from "@/contexts/match/infrastructure/postgres/match-repository";
import { createInMemoryVenueRepository } from "@/contexts/venue/infrastructure/memory/venue-repository";
import { createInMemoryPlayerRepository } from "@/contexts/player/infrastructure/memory/player-repository";
import { createInMemoryTeamRepository } from "@/contexts/team/infrastructure/memory/team-repository";
import { createInMemoryMatchRepository } from "@/contexts/match/infrastructure/memory/match-repository";
import { PostgresMatchStatisticsRepository } from "@/contexts/statistic/infrastructure/postgres/match-statistics-repository";
import { PostgresMatchStatisticTypeRepository } from "@/contexts/statistic/infrastructure/postgres/match-statistic-type-repository";
import { createInMemoryMatchStatisticsRepository } from "@/contexts/statistic/infrastructure/memory/match-statistics-repository";
import { syncMatchStatisticTypes } from "@/contexts/statistic/application/sync-match-statistic-types";
export interface StatisticsDependencies {
    computeMatchStatistic: ComputeMatchStatisticUseCase;
}

function createIdentityServices(canonicalMappingRepository: InMemoryCanonicalMappingRepository | PostgresCanonicalMappingRepository) {
    const idGenerator = new FingerprintIdGenerator();
    const entityResolver = new EntityResolver(canonicalMappingRepository, idGenerator);
    const identityHasherFactory = new IdentityHasherFactory();
    registerIdentityHashers(identityHasherFactory);

    return { entityResolver, identityHasherFactory };
}

function createUseCases(
    entityResolver: EntityResolver,
    identityHasherFactory: IdentityHasherFactory,
    venueRepository: ReturnType<typeof createInMemoryVenueRepository>["repository"] | PostgresVenueRepository,
    teamRepository: ReturnType<typeof createInMemoryTeamRepository>["repository"] | PostgresTeamRepository,
    playerRepository: ReturnType<typeof createInMemoryPlayerRepository>["repository"] | PostgresPlayerRepository,
    matchRepository: ReturnType<typeof createInMemoryMatchRepository>["repository"] | PostgresMatchRepository,
) {
    const resolveVenue = new ResolveVenueUseCase(entityResolver, identityHasherFactory, venueRepository);
    const resolveTeam = new ResolveTeamUseCase(entityResolver, identityHasherFactory, teamRepository);
    const resolvePlayer = new ResolvePlayerUseCase(entityResolver, identityHasherFactory, playerRepository);
    const ingestMatch = new IngestMatchUseCase(
        entityResolver,
        identityHasherFactory,
        matchRepository,
        resolveVenue,
        resolveTeam,
        resolvePlayer,
    );

    return { resolveVenue, resolveTeam, resolvePlayer, ingestMatch };
}

function createStatisticServices(matchStatisticsRepository: MatchStatisticsRepository): StatisticsDependencies {
    const computerRegistry = MatchStatisticComputerRegistry.createDefault();
    const computeMatchStatistic = new ComputeMatchStatisticUseCase(matchStatisticsRepository, computerRegistry);

    return { computeMatchStatistic };
}

export async function createPostgresDependencies(connectionString: string): Promise<{
    dependencies: IngestionDependencies;
    statistics: StatisticsDependencies;
    close: () => Promise<void>;
}> {
    const { db, pool } = createDatabaseClient(connectionString);

    const canonicalMappingRepository = new PostgresCanonicalMappingRepository(db);
    const { entityResolver, identityHasherFactory } = createIdentityServices(canonicalMappingRepository);

    const venueRepository = new PostgresVenueRepository(db);
    const playerRepository = new PostgresPlayerRepository(db);
    const teamRepository = new PostgresTeamRepository(db);
    const matchRepository = new PostgresMatchRepository(db);
    const matchStatisticsRepository = new PostgresMatchStatisticsRepository(db);
    const matchStatisticTypeRepository = new PostgresMatchStatisticTypeRepository(db);
    await syncMatchStatisticTypes(matchStatisticTypeRepository);

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueRepository,
        teamRepository,
        playerRepository,
        matchRepository,
    );

    const statistics = createStatisticServices(matchStatisticsRepository);

    return {
        dependencies: { ingestMatch },
        statistics,
        close: async () => {
            await pool.end();
        },
    };
}

export function createMemoryDependencies(): {
    dependencies: IngestionDependencies;
    statistics: StatisticsDependencies;
    counts: () => { players: number; teams: number; venues: number; matches: number; matchStatistics: number };
} {
    const canonicalMappingRepository = new InMemoryCanonicalMappingRepository();
    const { entityResolver, identityHasherFactory } = createIdentityServices(canonicalMappingRepository);

    const venueStore = createInMemoryVenueRepository();
    const playerStore = createInMemoryPlayerRepository();
    const teamStore = createInMemoryTeamRepository();
    const matchStore = createInMemoryMatchRepository();
    const matchStatisticsStore = createInMemoryMatchStatisticsRepository();

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueStore.repository,
        teamStore.repository,
        playerStore.repository,
        matchStore.repository,
    );

    const statistics = createStatisticServices(matchStatisticsStore.repository);

    return {
        dependencies: { ingestMatch },
        statistics,
        counts: () => ({
            players: playerStore.count(),
            teams: teamStore.count(),
            venues: venueStore.count(),
            matches: matchStore.count(),
            matchStatistics: matchStatisticsStore.count(),
        }),
    };
}
