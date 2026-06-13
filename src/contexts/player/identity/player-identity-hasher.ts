import { normalize, optionalNormalizedField } from "@/shared/identity/domain/hashing/normalize";
import { IdentityHasher } from "@/shared/identity/domain/hashing/identity-hasher";
import { PlayerIdentityInput } from "@/contexts/player/identity/player-identity-input";

export class PlayerIdentityHasher implements IdentityHasher<PlayerIdentityInput> {
    public hash(input: PlayerIdentityInput): string {
        return [
            "player",
            normalize(input.fullName),
            optionalNormalizedField(input.dateOfBirth),
        ].join(":");
    }
}
