import { ProviderReference } from "@/domain/identity/models/provider-reference";
import { ProviderMappingRepository } from "@/domain/identity/repositories/provider-mapping-repository";
import { IdGenerator } from "@/domain/identity/services/id-generator";

export interface ResolveOrCreateParams<T> {
    providerReference: ProviderReference;
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
    private readonly idGenerator: IdGenerator;

    public constructor(
        providerMappingRepository: ProviderMappingRepository,
        idGenerator: IdGenerator,
    ) {
        this.providerMappingRepository = providerMappingRepository;
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
        const internalId = this.providerMappingRepository.findInternalId(params.providerReference);
        if (internalId) {
            const existing = params.findEntity(internalId);
            if (existing) {
                return existing;
            }
        }

        const newInternalId = this.idGenerator.generate();
        const entity = params.createEntity(newInternalId);
        params.saveEntity(entity);
        this.providerMappingRepository.save(params.providerReference, newInternalId);
        return entity;
    }
}
