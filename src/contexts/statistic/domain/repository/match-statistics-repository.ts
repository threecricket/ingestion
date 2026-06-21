import { MatchStatistic } from "../models/match-statistic";

export interface MatchStatisticsRepository {
    findByMatchIdAndStatisticTypeNameAndEntityId(
        matchId: string,
        statisticTypeName: string,
        entityId: string,
    ): Promise<MatchStatistic | null>;
    save(matchStatistic: MatchStatistic): Promise<void>;
}
