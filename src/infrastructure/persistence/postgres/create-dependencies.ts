import { EntityResolver } from "@/domain/identity/services/entity-resolver";
import { IdentityHasherFactory } from "@/domain/identity/hashing/identity-hasher-factory";
import { ProviderDependencies } from "@/domain/provider/models/provider";
import { UuidIdGenerator } from "@/infrastructure/identity/uuid-id-generator";
import { createDatabaseClient } from "@/infrastructure/persistence/postgres/client";
import { PostgresCanonicalMappingRepository } from "@/infrastructure/persistence/postgres/repositories/canonical-mapping-repository";
import { PostgresMatchRepository } from "@/infrastructure/persistence/postgres/repositories/match-repository";
import { PostgresPlayerRepository } from "@/infrastructure/persistence/postgres/repositories/player-repository";
import { PostgresTeamRepository } from "@/infrastructure/persistence/postgres/repositories/team-repository";
import { PostgresVenueRepository } from "@/infrastructure/persistence/postgres/repositories/venue-repository";

export async function createPostgresDependencies(connectionString: string): Promise<{
    dependencies: ProviderDependencies;
    close: () => Promise<void>;
}> {
    const { db, pool } = createDatabaseClient(connectionString);

    const canonicalMappingRepository = new PostgresCanonicalMappingRepository(db);
    const idGenerator = new UuidIdGenerator();
    const entityResolver = new EntityResolver(canonicalMappingRepository, idGenerator);
    const identityHasherFactory = new IdentityHasherFactory();

    return {
        dependencies: {
            entityResolver,
            identityHasherFactory,
            playerRepository: new PostgresPlayerRepository(db),
            teamRepository: new PostgresTeamRepository(db),
            venueRepository: new PostgresVenueRepository(db),
            matchRepository: new PostgresMatchRepository(db),
        },
        close: async () => {
            await pool.end();
        },
    };
}
