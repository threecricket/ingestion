import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { CanonicalMappingRepository } from "@/domain/identity/repositories/canonical-mapping-repository";
import { IdGenerator } from "@/domain/identity/services/id-generator";

export interface ResolveOrCreateParams<T> {
    canonicalIdentity: CanonicalIdentity;
    findEntity: (internalId: string) => Promise<T | null>;
    saveEntity: (entity: T) => Promise<void>;
    createEntity: (internalId: string) => T;
}

export interface FindByCanonicalIdentityParams<T> {
    canonicalIdentity: CanonicalIdentity;
    findEntity: (internalId: string) => Promise<T | null>;
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

    public async findByCanonicalIdentity<T>(params: FindByCanonicalIdentityParams<T>): Promise<T | null> {
        const internalId = await this.canonicalMappingRepository.findInternalId(params.canonicalIdentity);
        if (!internalId) {
            return null;
        }

        return params.findEntity(internalId);
    }

    public async resolveOrCreate<T>(params: ResolveOrCreateParams<T>): Promise<T> {
        const canonicalInternalId = await this.canonicalMappingRepository.findInternalId(params.canonicalIdentity);
        if (canonicalInternalId) {
            const existing = await params.findEntity(canonicalInternalId);
            if (existing) {
                return existing;
            }
        }

        const newInternalId = this.idGenerator.generate();
        const entity = params.createEntity(newInternalId);
        await params.saveEntity(entity);
        await this.canonicalMappingRepository.save(params.canonicalIdentity, newInternalId);
        return entity;
    }
}
