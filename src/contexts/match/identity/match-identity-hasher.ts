import { normalize } from "@/shared/identity/domain/hashing/normalize";
import { IdentityHasher } from "@/shared/identity/domain/hashing/identity-hasher";
import { MatchIdentityInput } from "@/contexts/match/identity/match-identity-input";

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
