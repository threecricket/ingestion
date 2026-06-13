import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { CanonicalIdentity } from "@/shared/identity/domain/models/canonical-identity";
import { IdentityHasher } from "@/shared/identity/domain/hashing/identity-hasher";

export class IdentityHasherFactory {
    private readonly hashers: Partial<Record<EntityType, IdentityHasher<unknown>>> = {};

    public register(entityType: EntityType, hasher: IdentityHasher<unknown>): void {
        this.hashers[entityType] = hasher;
    }

    public toCanonicalIdentity(entityType: EntityType, input: unknown): CanonicalIdentity {
        const hasher = this.hashers[entityType];
        if (!hasher) {
            throw new Error(`No identity hasher registered for entity type: ${entityType}`);
        }

        return CanonicalIdentity.create(entityType, hasher.hash(input));
    }
}
