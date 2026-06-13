import { EntityType } from "@/shared/identity/domain/models/entity-type";

export class CanonicalIdentity {
    private readonly entityType: EntityType;
    private readonly fingerprint: string;

    private constructor(entityType: EntityType, fingerprint: string) {
        this.entityType = entityType;
        this.fingerprint = fingerprint;
    }

    public static create(entityType: EntityType, fingerprint: string): CanonicalIdentity {
        if (!entityType || !fingerprint) {
            throw new Error("Invalid canonical identity data");
        }

        return new CanonicalIdentity(entityType, fingerprint);
    }

    public getEntityType(): EntityType {
        return this.entityType;
    }

    public getFingerprint(): string {
        return this.fingerprint;
    }
}
