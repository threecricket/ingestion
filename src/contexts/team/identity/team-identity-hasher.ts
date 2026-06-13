import { normalize, optionalNormalizedField } from "@/shared/identity/domain/hashing/normalize";
import { IdentityHasher } from "@/shared/identity/domain/hashing/identity-hasher";
import { TeamIdentityInput } from "@/contexts/team/identity/team-identity-input";

export class TeamIdentityHasher implements IdentityHasher<TeamIdentityInput> {
    public hash(input: TeamIdentityInput): string {
        return [
            "team",
            normalize(input.teamName),
            optionalNormalizedField(input.country),
        ].join(":");
    }
}
