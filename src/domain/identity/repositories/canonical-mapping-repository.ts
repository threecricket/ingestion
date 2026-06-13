import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";

export interface CanonicalMappingRepository {
    findInternalId(identity: CanonicalIdentity): string | null;
    save(identity: CanonicalIdentity, internalId: string): void;
}
