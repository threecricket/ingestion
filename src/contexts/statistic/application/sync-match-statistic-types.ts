import { createMatchStatisticComputers } from "@/contexts/statistic/application/register-match-statistic-computers";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repositories/match-statistic-type-repository";

export async function syncMatchStatisticTypes(
    matchStatisticTypeRepository: MatchStatisticTypeRepository,
): Promise<void> {
    for (const computer of createMatchStatisticComputers()) {
        await matchStatisticTypeRepository.save(computer.getType());
    }
}
