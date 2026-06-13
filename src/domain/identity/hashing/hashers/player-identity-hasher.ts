import { normalize, optionalNormalizedField } from "@/domain/identity/hashing/normalize";
import { IdentityHasher } from "@/domain/identity/hashing/identity-hasher";
import { PlayerIdentityInput } from "@/domain/identity/hashing/inputs/player-identity-input";

export class PlayerIdentityHasher implements IdentityHasher<PlayerIdentityInput> {
    public hash(input: PlayerIdentityInput): string {
        return [
            "player",
            normalize(input.firstName),
            normalize(input.lastName),
            optionalNormalizedField(input.dateOfBirth),
        ].join(":");
    }
}
