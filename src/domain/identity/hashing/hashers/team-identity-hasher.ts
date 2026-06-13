import { normalize, optionalNormalizedField } from "@/domain/identity/hashing/normalize";
import { IdentityHasher } from "@/domain/identity/hashing/identity-hasher";
import { TeamIdentityInput } from "@/domain/identity/hashing/inputs/team-identity-input";

export class TeamIdentityHasher implements IdentityHasher<TeamIdentityInput> {
    public hash(input: TeamIdentityInput): string {
        return [
            "team",
            normalize(input.teamName),
            optionalNormalizedField(input.country),
        ].join(":");
    }
}
