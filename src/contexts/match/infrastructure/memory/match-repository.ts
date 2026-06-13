import { Match } from "@/contexts/match/domain/models/match";
import { MatchRepository } from "@/contexts/match/domain/repositories/match-repository";

export function createInMemoryMatchRepository(): {
    repository: MatchRepository;
    count: () => number;
} {
    const matches = new Map<string, Match>();

    return {
        repository: {
            findById: async (id) => matches.get(id) ?? null,
            save: async (match) => { matches.set(match.getMatchId(), match); },
        },
        count: () => matches.size,
    };
}
