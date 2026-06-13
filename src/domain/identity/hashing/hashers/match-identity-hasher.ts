import { normalize } from "@/domain/identity/hashing/normalize";
import { IdentityHasher } from "@/domain/identity/hashing/identity-hasher";
import { MatchIdentityInput } from "@/domain/identity/hashing/inputs/match-identity-input";

export class MatchIdentityHasher implements IdentityHasher<MatchIdentityInput> {
    public hash(input: MatchIdentityInput): string {
        const [teamA, teamB] = [input.team1Id, input.team2Id].sort();

        return [
            "match",
            input.matchDate,
            normalize(input.format),
            teamA,
            teamB,
        ].join(":");
    }
}
