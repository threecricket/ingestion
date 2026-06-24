import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repositories/match-statistics-repository";
import { MatchStatistic } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticComputerRegistry } from "@/contexts/statistic/domain/computation/match-statistic-registry";
import { MatchStatisticComputeContext } from "@/contexts/statistic/domain/computation/match-statistic-computer";
import { isWinProbabilitySupportedFormat } from "@/contexts/statistic/domain/computation/shared/supported-formats";
import { ComputeMatchStatisticCommand } from "./compute-match-statistic-command";
import { ComputeWinProbabilities } from "./compute-win-probabilities";

export class ComputeMatchStatisticUseCase {
    public constructor(
        private readonly matchStatisticsRepository: MatchStatisticsRepository,
        private readonly computerRegistry: MatchStatisticComputerRegistry,
        private readonly computeWinProbabilities: ComputeWinProbabilities | null = null,
    ) {}

    public async execute(command: ComputeMatchStatisticCommand): Promise<MatchStatistic[]> {
        const { match, statisticType } = command;
        const typeName = statisticType.getName();

        const computer = this.computerRegistry.get(typeName);
        if (!computer) {
            throw new Error(`No match statistic computer registered for type: ${typeName}`);
        }

        const context = await this.buildComputeContext(match);
        const statistics = await Promise.resolve(computer.compute(match, context));
        return this.persist(statistics);
    }

    public async computeAllForMatch(match: Match): Promise<MatchStatistic[]> {
        const context = await this.buildComputeContext(match);
        const results: MatchStatistic[] = [];

        for (const computer of this.computerRegistry.getAll()) {
            const statistics = await Promise.resolve(computer.compute(match, context));
            const persisted = await this.persist(statistics);
            results.push(...persisted);
        }

        return results;
    }

    private async buildComputeContext(match: Match): Promise<MatchStatisticComputeContext> {
        if (!this.computeWinProbabilities || !isWinProbabilitySupportedFormat(match.getMatchFormat())) {
            return {};
        }

        const winProbabilityByBallIndex = await this.computeWinProbabilities.computeForMatch(match);
        return { winProbabilityByBallIndex };
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
