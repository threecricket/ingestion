import { EntityType } from "@/domain/identity/models/entity-type";
import { ProviderReference } from "@/domain/identity/models/provider-reference";
import { ProviderMappingRepository } from "@/domain/identity/repositories/provider-mapping-repository";

function toMappingKey(reference: ProviderReference): string {
    return `${reference.getProviderId()}:${reference.getEntityType()}:${reference.getExternalId()}`;
}

export class InMemoryProviderMappingRepository implements ProviderMappingRepository {
    private readonly mappings = new Map<string, string>();

    public findInternalId(reference: ProviderReference): string | null {
        return this.mappings.get(toMappingKey(reference)) ?? null;
    }

    public save(reference: ProviderReference, internalId: string): void {
        this.mappings.set(toMappingKey(reference), internalId);
    }
}
