import { ALL_MATCH_STATISTIC_COMPUTERS } from "@/contexts/statistic/domain/statistics/index";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repository/match-statistic-type-repository";

export async function syncMatchStatisticTypes(
    matchStatisticTypeRepository: MatchStatisticTypeRepository,
): Promise<void> {
    for (const computer of ALL_MATCH_STATISTIC_COMPUTERS) {
        await matchStatisticTypeRepository.save(computer.getType());
    }
}
