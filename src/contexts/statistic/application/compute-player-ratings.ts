import { PerformanceGateway, PlayerMatchStatisticInput } from "@/contexts/statistic/domain/ports/performance-gateway";
import { PlayerRatingsRepository } from "@/contexts/statistic/domain/repositories/player-ratings-repository";
import { PlayerStatisticsQueryRepository } from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";

export class ComputePlayerRatingsUseCase {
    public constructor(
        private readonly queryRepository: PlayerStatisticsQueryRepository,
        private readonly performanceGateway: PerformanceGateway,
        private readonly playerRatingsRepository: PlayerRatingsRepository,
    ) {}

    public async computeForAllPlayers(): Promise<number> {
        const playerIds = await this.queryRepository.findAllPlayerIds();
        return this.computeForPlayers(playerIds);
    }

    public async computeForPlayers(playerIds: string[]): Promise<number> {
        const uniqueIds = [...new Set(playerIds)];
        if (uniqueIds.length === 0) {
            return 0;
        }

        const statisticsByPlayer = await this.groupStatisticsByPlayer(uniqueIds);

        let ratingsPersisted = 0;
        for (const playerId of uniqueIds) {
            const statistics = statisticsByPlayer.get(playerId) ?? [];
            if (statistics.length === 0) {
                continue;
            }

            try {
                const ratings = await this.performanceGateway.computePlayerRatings(playerId, statistics);
                for (const rating of ratings) {
                    await this.playerRatingsRepository.save(rating);
                    ratingsPersisted += 1;
                }
            } catch (error) {
                console.error(`Failed to compute ratings for player ${playerId}, skipping:`, error);
            }
        }

        return ratingsPersisted;
    }

    private async groupStatisticsByPlayer(
        playerIds: string[],
    ): Promise<Map<string, PlayerMatchStatisticInput[]>> {
        const records = await this.queryRepository.findPlayerStatistics(playerIds);

        const grouped = new Map<string, PlayerMatchStatisticInput[]>();
        for (const record of records) {
            const list = grouped.get(record.playerId) ?? [];
            list.push({
                matchId: record.matchId,
                format: record.format,
                statisticName: record.statisticName,
                value: record.value,
            });
            grouped.set(record.playerId, list);
        }

        return grouped;
    }
}
