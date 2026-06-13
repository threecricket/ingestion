import { eq, and } from "drizzle-orm";
import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { CanonicalMappingRepository } from "@/domain/identity/repositories/canonical-mapping-repository";
import { Database } from "@/infrastructure/persistence/postgres/client";
import { canonicalIdentityMappings } from "@/infrastructure/persistence/postgres/schema";

export class PostgresCanonicalMappingRepository implements CanonicalMappingRepository {
    public constructor(private readonly db: Database) {}

    public async findInternalId(identity: CanonicalIdentity): Promise<string | null> {
        const rows = await this.db
            .select({ internalId: canonicalIdentityMappings.internalId })
            .from(canonicalIdentityMappings)
            .where(and(
                eq(canonicalIdentityMappings.entityType, identity.getEntityType()),
                eq(canonicalIdentityMappings.fingerprint, identity.getFingerprint()),
            ))
            .limit(1);

        return rows[0]?.internalId ?? null;
    }

    public async save(identity: CanonicalIdentity, internalId: string): Promise<void> {
        await this.db
            .insert(canonicalIdentityMappings)
            .values({
                entityType: identity.getEntityType(),
                fingerprint: identity.getFingerprint(),
                internalId,
            })
            .onConflictDoNothing();
    }
}
