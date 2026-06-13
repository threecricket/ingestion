import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { CanonicalMappingRepository } from "@/domain/identity/repositories/canonical-mapping-repository";

function toMappingKey(identity: CanonicalIdentity): string {
    return `${identity.getEntityType()}:${identity.getFingerprint()}`;
}

export class InMemoryCanonicalMappingRepository implements CanonicalMappingRepository {
    private readonly mappings = new Map<string, string>();

    public findInternalId(identity: CanonicalIdentity): string | null {
        return this.mappings.get(toMappingKey(identity)) ?? null;
    }

    public save(identity: CanonicalIdentity, internalId: string): void {
        this.mappings.set(toMappingKey(identity), internalId);
    }
}
