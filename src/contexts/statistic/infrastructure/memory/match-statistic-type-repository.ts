import { MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { ALL_MATCH_STATISTIC_COMPUTERS } from "@/contexts/statistic/domain/statistics/index";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repository/match-statistic-type-repository";

export function createInMemoryMatchStatisticTypeRepository(): {
    repository: MatchStatisticTypeRepository;
    count: () => number;
} {
    const types = new Map<string, MatchStatisticType>(
        ALL_MATCH_STATISTIC_COMPUTERS.map((computer) => {
            const matchStatisticType = computer.getType();
            return [matchStatisticType.getName(), matchStatisticType] as const;
        }),
    );

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
