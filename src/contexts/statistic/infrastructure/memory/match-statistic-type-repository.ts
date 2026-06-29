import { MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repositories/match-statistic-type-repository";

export function createInMemoryMatchStatisticTypeRepository(): {
    repository: MatchStatisticTypeRepository;
    count: () => number;
} {
    const types = new Map<string, MatchStatisticType>();

    return {
        repository: {
            findByName: async (name) => types.get(name) ?? null,
            save: async (matchStatisticType) => {
                types.set(matchStatisticType.getName(), matchStatisticType);
            },
        },
        count: () => types.size,
    };
}
