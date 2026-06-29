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
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";
import { ComputeMatchStatisticUseCase } from "@/contexts/statistic/application/compute-match-statistic";
import { ComputePlayerRatingsUseCase } from "@/contexts/statistic/application/compute-player-ratings";
import { PublishRatingNormsUseCase } from "@/contexts/statistic/application/publish-rating-norms";
import { SyncCatalogueUseCase } from "@/contexts/statistic/application/sync-catalogue";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repositories/match-statistics-repository";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repositories/match-statistic-type-repository";
import { PlayerRatingTypeRepository } from "@/contexts/statistic/domain/repositories/player-rating-type-repository";
import { PlayerRatingsRepository } from "@/contexts/statistic/domain/repositories/player-ratings-repository";
import { PlayerStatisticsQueryRepository } from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";
import { PerformanceGateway } from "@/contexts/statistic/domain/ports/performance-gateway";
import { PerformanceApiClient } from "@/contexts/statistic/infrastructure/performance-api/performance-api-client";
import { PerformanceApiGateway } from "@/contexts/statistic/infrastructure/performance-api/performance-api-gateway";
import { createRatingNormsWriter } from "@/contexts/statistic/infrastructure/rating-norms/create-rating-norms-writer";
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
import { PostgresPlayerRatingTypeRepository } from "@/contexts/statistic/infrastructure/postgres/player-rating-type-repository";
import { PostgresPlayerRatingsRepository } from "@/contexts/statistic/infrastructure/postgres/player-ratings-repository";
import { PostgresPlayerStatisticsQueryRepository } from "@/contexts/statistic/infrastructure/postgres/player-statistics-query-repository";
import { createInMemoryMatchStatisticsRepository } from "@/contexts/statistic/infrastructure/memory/match-statistics-repository";
import { createInMemoryMatchStatisticTypeRepository } from "@/contexts/statistic/infrastructure/memory/match-statistic-type-repository";
import { createInMemoryPlayerRatingTypeRepository } from "@/contexts/statistic/infrastructure/memory/player-rating-type-repository";
import { createInMemoryPlayerRatingsRepository } from "@/contexts/statistic/infrastructure/memory/player-ratings-repository";

const DEFAULT_RATING_NORMS_WINDOW_DAYS = 730;

export interface StatisticsDependencies {
    performanceGateway: PerformanceGateway;
    syncCatalogue: SyncCatalogueUseCase;
    computeMatchStatistic: ComputeMatchStatisticUseCase;
    publishRatingNorms: PublishRatingNormsUseCase | null;
    computePlayerRatings: ComputePlayerRatingsUseCase | null;
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

function createPerformanceGateway(): PerformanceGateway {
    const performanceApiUrl = process.env.PERFORMANCE_API_URL?.trim();
    if (!performanceApiUrl) {
        throw new Error("PERFORMANCE_API_URL is required");
    }

    return new PerformanceApiGateway(new PerformanceApiClient(performanceApiUrl));
}

function getRatingNormsWindowDays(): number {
    const raw = process.env.RATING_NORMS_WINDOW_DAYS?.trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATING_NORMS_WINDOW_DAYS;
}

interface StatisticServiceArgs {
    performanceGateway: PerformanceGateway;
    matchStatisticsRepository: MatchStatisticsRepository;
    matchStatisticTypeRepository: MatchStatisticTypeRepository;
    playerRatingTypeRepository: PlayerRatingTypeRepository;
    playerRatingsRepository: PlayerRatingsRepository;
    playerRepository: PlayerRepository;
    playerStatisticsQueryRepository: PlayerStatisticsQueryRepository | null;
}

function createStatisticServices(args: StatisticServiceArgs): StatisticsDependencies {
    const syncCatalogue = new SyncCatalogueUseCase(
        args.performanceGateway,
        args.matchStatisticTypeRepository,
        args.playerRatingTypeRepository,
    );

    const computeMatchStatistic = new ComputeMatchStatisticUseCase(
        args.matchStatisticsRepository,
        args.performanceGateway,
        args.playerRepository,
    );

    let publishRatingNorms: PublishRatingNormsUseCase | null = null;
    let computePlayerRatings: ComputePlayerRatingsUseCase | null = null;

    const ratingNormsWriter = createRatingNormsWriter();
    if (args.playerStatisticsQueryRepository && ratingNormsWriter) {
        publishRatingNorms = new PublishRatingNormsUseCase(
            args.playerStatisticsQueryRepository,
            ratingNormsWriter,
            getRatingNormsWindowDays(),
        );
        computePlayerRatings = new ComputePlayerRatingsUseCase(
            args.playerStatisticsQueryRepository,
            args.performanceGateway,
            args.playerRatingsRepository,
        );
    }

    return {
        performanceGateway: args.performanceGateway,
        syncCatalogue,
        computeMatchStatistic,
        publishRatingNorms,
        computePlayerRatings,
    };
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
    const playerRatingTypeRepository = new PostgresPlayerRatingTypeRepository(db);
    const playerRatingsRepository = new PostgresPlayerRatingsRepository(db);
    const playerStatisticsQueryRepository = new PostgresPlayerStatisticsQueryRepository(db);

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueRepository,
        teamRepository,
        playerRepository,
        matchRepository,
    );

    const statistics = createStatisticServices({
        performanceGateway: createPerformanceGateway(),
        matchStatisticsRepository,
        matchStatisticTypeRepository,
        playerRatingTypeRepository,
        playerRatingsRepository,
        playerRepository,
        playerStatisticsQueryRepository,
    });

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
    counts: () => {
        players: number;
        teams: number;
        venues: number;
        matches: number;
        matchStatistics: number;
        playerRatings: number;
    };
} {
    const canonicalMappingRepository = new InMemoryCanonicalMappingRepository();
    const { entityResolver, identityHasherFactory } = createIdentityServices(canonicalMappingRepository);

    const venueStore = createInMemoryVenueRepository();
    const playerStore = createInMemoryPlayerRepository();
    const teamStore = createInMemoryTeamRepository();
    const matchStore = createInMemoryMatchRepository();
    const matchStatisticsStore = createInMemoryMatchStatisticsRepository();
    const matchStatisticTypeStore = createInMemoryMatchStatisticTypeRepository();
    const playerRatingTypeStore = createInMemoryPlayerRatingTypeRepository();
    const playerRatingsStore = createInMemoryPlayerRatingsRepository();

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueStore.repository,
        teamStore.repository,
        playerStore.repository,
        matchStore.repository,
    );

    const statistics = createStatisticServices({
        performanceGateway: createPerformanceGateway(),
        matchStatisticsRepository: matchStatisticsStore.repository,
        matchStatisticTypeRepository: matchStatisticTypeStore.repository,
        playerRatingTypeRepository: playerRatingTypeStore.repository,
        playerRatingsRepository: playerRatingsStore.repository,
        playerRepository: playerStore.repository,
        playerStatisticsQueryRepository: null,
    });

    return {
        dependencies: { ingestMatch },
        statistics,
        counts: () => ({
            players: playerStore.count(),
            teams: teamStore.count(),
            venues: venueStore.count(),
            matches: matchStore.count(),
            matchStatistics: matchStatisticsStore.count(),
            playerRatings: playerRatingsStore.count(),
        }),
    };
}
