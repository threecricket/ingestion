import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { CanonicalMappingRepository } from "@/domain/identity/repositories/canonical-mapping-repository";
import { IdGenerator } from "@/domain/identity/services/id-generator";

export interface ResolveOrCreateParams<T> {
    canonicalIdentity: CanonicalIdentity;
    findEntity: (internalId: string) => T | null;
    saveEntity: (entity: T) => void;
    createEntity: (internalId: string) => T;
}

export interface FindByCanonicalIdentityParams<T> {
    canonicalIdentity: CanonicalIdentity;
    findEntity: (internalId: string) => T | null;
}

export class EntityResolver {
    private readonly canonicalMappingRepository: CanonicalMappingRepository;
    private readonly idGenerator: IdGenerator;

    public constructor(
        canonicalMappingRepository: CanonicalMappingRepository,
        idGenerator: IdGenerator,
    ) {
        this.canonicalMappingRepository = canonicalMappingRepository;
        this.idGenerator = idGenerator;
    }

    public findByCanonicalIdentity<T>(params: FindByCanonicalIdentityParams<T>): T | null {
        const internalId = this.canonicalMappingRepository.findInternalId(params.canonicalIdentity);
        if (!internalId) {
            return null;
        }

        return params.findEntity(internalId);
    }

    public resolveOrCreate<T>(params: ResolveOrCreateParams<T>): T {
        const canonicalInternalId = this.canonicalMappingRepository.findInternalId(params.canonicalIdentity);
        if (canonicalInternalId) {
            const existing = params.findEntity(canonicalInternalId);
            if (existing) {
                return existing;
            }
        }

        const newInternalId = this.idGenerator.generate();
        const entity = params.createEntity(newInternalId);
        params.saveEntity(entity);
        this.canonicalMappingRepository.save(params.canonicalIdentity, newInternalId);
        return entity;
    }
}
