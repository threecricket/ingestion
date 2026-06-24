import { MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticComputer } from "@/contexts/statistic/domain/computation/match-statistic-computer";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repositories/match-statistic-type-repository";

export function createInMemoryMatchStatisticTypeRepository(
    computers: MatchStatisticComputer[],
): {
    repository: MatchStatisticTypeRepository;
    count: () => number;
} {
    const types = new Map<string, MatchStatisticType>(
        computers.map((computer) => {
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
