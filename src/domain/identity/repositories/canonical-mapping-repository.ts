import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";

export interface CanonicalMappingRepository {
    findInternalId(identity: CanonicalIdentity): Promise<string | null>;
    save(identity: CanonicalIdentity, internalId: string): Promise<void>;
}
