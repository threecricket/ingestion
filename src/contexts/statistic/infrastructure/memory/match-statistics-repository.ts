import { MatchStatistic } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repositories/match-statistics-repository";

function toKey(matchId: string, statisticTypeName: string, entityId: string): string {
    return `${matchId}:${statisticTypeName}:${entityId}`;
}

export function createInMemoryMatchStatisticsRepository(): {
    repository: MatchStatisticsRepository;
    count: () => number;
} {
    const statistics = new Map<string, MatchStatistic>();

    return {
        repository: {
            findByMatchIdAndStatisticTypeNameAndEntityId: async (matchId, statisticTypeName, entityId) => {
                return statistics.get(toKey(matchId, statisticTypeName, entityId)) ?? null;
            },
            save: async (matchStatistic) => {
                statistics.set(
                    toKey(
                        matchStatistic.getMatchId(),
                        matchStatistic.getStatisticTypeName(),
                        matchStatistic.getEntityId(),
                    ),
                    matchStatistic,
                );
            },
        },
        count: () => statistics.size,
    };
}
