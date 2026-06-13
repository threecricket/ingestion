import { EntityType } from "@/domain/identity/models/entity-type";

export class ProviderReference {
    private readonly providerId: string;
    private readonly entityType: EntityType;
    private readonly externalId: string;

    private constructor(providerId: string, entityType: EntityType, externalId: string) {
        this.providerId = providerId;
        this.entityType = entityType;
        this.externalId = externalId;
    }

    public static create(
        providerId: string,
        entityType: EntityType,
        externalId: string,
    ): ProviderReference {
        if (!providerId || !entityType || !externalId) {
            throw new Error("Invalid provider reference data");
        }

        return new ProviderReference(providerId, entityType, externalId);
    }

    public getProviderId(): string {
        return this.providerId;
    }

    public getEntityType(): EntityType {
        return this.entityType;
    }

    public getExternalId(): string {
        return this.externalId;
    }
}
