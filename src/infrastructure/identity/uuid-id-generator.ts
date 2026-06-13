import { randomUUID } from "crypto";
import { IdGenerator } from "@/domain/identity/services/id-generator";

export class UuidIdGenerator implements IdGenerator {
    public generate(): string {
        return randomUUID();
    }
}
