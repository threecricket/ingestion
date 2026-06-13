import { randomUUID } from "crypto";
import { IdGenerator } from "@/shared/identity/domain/services/id-generator";

export class UuidIdGenerator implements IdGenerator {
    public generate(): string {
        return randomUUID();
    }
}
