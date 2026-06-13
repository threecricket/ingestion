import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { UuidIdGenerator } from "@/shared/identity/infrastructure/uuid-id-generator";
import { InMemoryCanonicalMappingRepository } from "@/shared/identity/infrastructure/persistence/memory/canonical-mapping-repository";
import { PostgresCanonicalMappingRepository } from "@/shared/identity/infrastructure/persistence/postgres/canonical-mapping-repository";
import { createDatabaseClient } from "@/shared/persistence/postgres/client";
import { registerIdentityHashers } from "@/bootstrap/register-identity-hashers";
import { ResolveVenueUseCase } from "@/contexts/venue/application/resolve-venue";
import { ResolveTeamUseCase } from "@/contexts/team/application/resolve-team";
import { ResolvePlayerUseCase } from "@/contexts/player/application/resolve-player";
import { IngestMatchUseCase } from "@/contexts/match/application/ingest-match";
import { IngestionDependencies } from "@/contexts/ingestion/domain/ingestion-dependencies";
import { PostgresVenueRepository } from "@/contexts/venue/infrastructure/postgres/venue-repository";
import { PostgresPlayerRepository } from "@/contexts/player/infrastructure/postgres/player-repository";
import { PostgresTeamRepository } from "@/contexts/team/infrastructure/postgres/team-repository";
import { PostgresMatchRepository } from "@/contexts/match/infrastructure/postgres/match-repository";
import { createInMemoryVenueRepository } from "@/contexts/venue/infrastructure/memory/venue-repository";
import { createInMemoryPlayerRepository } from "@/contexts/player/infrastructure/memory/player-repository";
import { createInMemoryTeamRepository } from "@/contexts/team/infrastructure/memory/team-repository";
import { createInMemoryMatchRepository } from "@/contexts/match/infrastructure/memory/match-repository";

function createIdentityServices(canonicalMappingRepository: InMemoryCanonicalMappingRepository | PostgresCanonicalMappingRepository) {
    const idGenerator = new UuidIdGenerator();
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
    const resolveTeam = new ResolveTeamUseCase(entityResolver, identityHasherFactory, teamRepository, resolveVenue);
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

export async function createPostgresDependencies(connectionString: string): Promise<{
    dependencies: IngestionDependencies;
    close: () => Promise<void>;
}> {
    const { db, pool } = createDatabaseClient(connectionString);

    const canonicalMappingRepository = new PostgresCanonicalMappingRepository(db);
    const { entityResolver, identityHasherFactory } = createIdentityServices(canonicalMappingRepository);

    const venueRepository = new PostgresVenueRepository(db);
    const playerRepository = new PostgresPlayerRepository(db);
    const teamRepository = new PostgresTeamRepository(db);
    const matchRepository = new PostgresMatchRepository(db);

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueRepository,
        teamRepository,
        playerRepository,
        matchRepository,
    );

    return {
        dependencies: { ingestMatch },
        close: async () => {
            await pool.end();
        },
    };
}

export function createMemoryDependencies(): {
    dependencies: IngestionDependencies;
    counts: () => { players: number; teams: number; venues: number; matches: number };
} {
    const canonicalMappingRepository = new InMemoryCanonicalMappingRepository();
    const { entityResolver, identityHasherFactory } = createIdentityServices(canonicalMappingRepository);

    const venueStore = createInMemoryVenueRepository();
    const playerStore = createInMemoryPlayerRepository();
    const teamStore = createInMemoryTeamRepository();
    const matchStore = createInMemoryMatchRepository();

    const { ingestMatch } = createUseCases(
        entityResolver,
        identityHasherFactory,
        venueStore.repository,
        teamStore.repository,
        playerStore.repository,
        matchStore.repository,
    );

    return {
        dependencies: { ingestMatch },
        counts: () => ({
            players: playerStore.count(),
            teams: teamStore.count(),
            venues: venueStore.count(),
            matches: matchStore.count(),
        }),
    };
}
