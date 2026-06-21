import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repository/match-statistics-repository";
import { MatchStatistic } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticComputerRegistry } from "@/contexts/statistic/domain/statistics/match-statistic-registry";
import { ComputeMatchStatisticCommand } from "./compute-match-statistic-command";

export class ComputeMatchStatisticUseCase {
    public constructor(
        private readonly matchStatisticsRepository: MatchStatisticsRepository,
        private readonly computerRegistry: MatchStatisticComputerRegistry,
    ) {}

    public async execute(command: ComputeMatchStatisticCommand): Promise<MatchStatistic[]> {
        const { match, statisticType } = command;
        const typeName = statisticType.getName();

        const computer = this.computerRegistry.get(typeName);
        if (!computer) {
            throw new Error(`No match statistic computer registered for type: ${typeName}`);
        }

        const statistics = computer.compute(match);
        return this.persist(statistics);
    }

    public async computeAllForMatch(match: Match): Promise<MatchStatistic[]> {
        const results: MatchStatistic[] = [];

        for (const computer of this.computerRegistry.getAll()) {
            const statistics = computer.compute(match);
            const persisted = await this.persist(statistics);
            results.push(...persisted);
        }

        return results;
    }

    private async persist(statistics: MatchStatistic[]): Promise<MatchStatistic[]> {
        const results: MatchStatistic[] = [];

        for (const statistic of statistics) {
            const existing = await this.matchStatisticsRepository.findByMatchIdAndStatisticTypeNameAndEntityId(
                statistic.getMatchId(),
                statistic.getStatisticTypeName(),
                statistic.getEntityId(),
            );

            if (existing) {
                results.push(existing);
                continue;
            }

            await this.matchStatisticsRepository.save(statistic);
            results.push(statistic);
        }

        return results;
    }
}
