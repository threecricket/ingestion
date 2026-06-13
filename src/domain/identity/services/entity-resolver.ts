import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { ProviderReference } from "@/domain/identity/models/provider-reference";
import { CanonicalMappingRepository } from "@/domain/identity/repositories/canonical-mapping-repository";
import { ProviderMappingRepository } from "@/domain/identity/repositories/provider-mapping-repository";
import { IdGenerator } from "@/domain/identity/services/id-generator";

export interface ResolveOrCreateParams<T> {
    providerReference: ProviderReference;
    canonicalIdentity: CanonicalIdentity;
    findEntity: (internalId: string) => T | null;
    saveEntity: (entity: T) => void;
    createEntity: (internalId: string) => T;
}

export interface FindByProviderReferenceParams<T> {
    providerReference: ProviderReference;
    findEntity: (internalId: string) => T | null;
}

export class EntityResolver {
    private readonly providerMappingRepository: ProviderMappingRepository;
    private readonly canonicalMappingRepository: CanonicalMappingRepository;
    private readonly idGenerator: IdGenerator;

    public constructor(
        providerMappingRepository: ProviderMappingRepository,
        canonicalMappingRepository: CanonicalMappingRepository,
        idGenerator: IdGenerator,
    ) {
        this.providerMappingRepository = providerMappingRepository;
        this.canonicalMappingRepository = canonicalMappingRepository;
        this.idGenerator = idGenerator;
    }

    public findByProviderReference<T>(params: FindByProviderReferenceParams<T>): T | null {
        const internalId = this.providerMappingRepository.findInternalId(params.providerReference);
        if (!internalId) {
            return null;
        }

        return params.findEntity(internalId);
    }

    public resolveOrCreate<T>(params: ResolveOrCreateParams<T>): T {
        const providerInternalId = this.providerMappingRepository.findInternalId(params.providerReference);
        if (providerInternalId) {
            const existing = params.findEntity(providerInternalId);
            if (existing) {
                return existing;
            }
        }

        const canonicalInternalId = this.canonicalMappingRepository.findInternalId(params.canonicalIdentity);
        if (canonicalInternalId) {
            const existing = params.findEntity(canonicalInternalId);
            if (existing) {
                this.providerMappingRepository.save(params.providerReference, canonicalInternalId);
                return existing;
            }
        }

        const newInternalId = this.idGenerator.generate();
        const entity = params.createEntity(newInternalId);
        params.saveEntity(entity);
        this.providerMappingRepository.save(params.providerReference, newInternalId);
        this.canonicalMappingRepository.save(params.canonicalIdentity, newInternalId);
        return entity;
    }
}
