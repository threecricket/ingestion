import { Match } from "@/contexts/match/domain/models/match";
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repositories/match-statistics-repository";
import { MatchStatistic } from "@/contexts/statistic/domain/models/match-statistic";
import { PerformanceGateway } from "@/contexts/statistic/domain/ports/performance-gateway";
import { buildPlayerEnrichment } from "@/contexts/statistic/application/build-player-enrichment";

export class ComputeMatchStatisticUseCase {
    public constructor(
        private readonly matchStatisticsRepository: MatchStatisticsRepository,
        private readonly performanceGateway: PerformanceGateway,
        private readonly playerRepository: PlayerRepository,
    ) {}

    public async computeAllForMatch(match: Match): Promise<MatchStatistic[]> {
        const players = await buildPlayerEnrichment(match, this.playerRepository);
        const statistics = await this.performanceGateway.computeMatchStatistics(match, players);

        return this.persist(statistics);
    }

    private async persist(statistics: MatchStatistic[]): Promise<MatchStatistic[]> {
        const results: MatchStatistic[] = [];

        for (const statistic of statistics) {
            await this.matchStatisticsRepository.save(statistic);
            results.push(statistic);
        }

        return results;
    }
}
