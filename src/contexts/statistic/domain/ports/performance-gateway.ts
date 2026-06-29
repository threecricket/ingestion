import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { PlayerRating, PlayerRatingType } from "@/contexts/statistic/domain/models/player-rating";

export interface PlayerEnrichmentInput {
    battingHand: string | null;
    bowlingHand: string | null;
    bowlingStyle: string | null;
}

export interface PlayerMatchStatisticInput {
    matchId: string;
    format: string;
    statisticName: string;
    value: number;
}

export interface Catalogue {
    matchStatisticTypes: MatchStatisticType[];
    playerRatingTypes: PlayerRatingType[];
    ratingNormsVersion: string | null;
}

export interface PerformanceGateway {
    computeMatchStatistics(
        match: Match,
        players: Record<string, PlayerEnrichmentInput>,
    ): Promise<MatchStatistic[]>;

    computePlayerRatings(
        playerId: string,
        statistics: PlayerMatchStatisticInput[],
    ): Promise<PlayerRating[]>;

    getCatalogue(): Promise<Catalogue>;
}
