import { ProviderReference } from "@/domain/identity/models/provider-reference";

export interface ProviderMappingRepository {
    findInternalId(reference: ProviderReference): string | null;
    save(reference: ProviderReference, internalId: string): void;
}
