import { Match } from "@/contexts/match/domain/models/match";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { MatchStatistic, MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { PlayerRating, PlayerRatingType, RatingKind } from "@/contexts/statistic/domain/models/player-rating";
import {
    Catalogue,
    PerformanceGateway,
    PlayerEnrichmentInput,
    PlayerMatchStatisticInput,
} from "@/contexts/statistic/domain/ports/performance-gateway";
import { PerformanceApiClient } from "./performance-api-client";
import { toComputeMatchStatisticsRequest } from "./match-request-mapper";

const OVERALL_RATING_NAME = "overall";

export class PerformanceApiGateway implements PerformanceGateway {
    public constructor(private readonly client: PerformanceApiClient) {}

    public async computeMatchStatistics(
        match: Match,
        players: Record<string, PlayerEnrichmentInput>,
    ): Promise<MatchStatistic[]> {
        const request = toComputeMatchStatisticsRequest(match, players);
        const response = await this.client.computeMatchStatistics(request);

        return response.statistics.map((statistic) =>
            MatchStatistic.create(
                statistic.matchId,
                statistic.statisticTypeName,
                statistic.entityType as EntityType,
                statistic.entityId,
                statistic.value,
            ),
        );
    }

    public async computePlayerRatings(
        playerId: string,
        statistics: PlayerMatchStatisticInput[],
    ): Promise<PlayerRating[]> {
        const response = await this.client.computePlayerRatings({ playerId, statistics });

        const ratings: PlayerRating[] = [
            PlayerRating.create(
                response.playerId,
                OVERALL_RATING_NAME,
                response.overallRating,
                response.normsVersion,
            ),
        ];

        for (const subRating of response.subRatings) {
            ratings.push(
                PlayerRating.create(
                    response.playerId,
                    subRating.name,
                    subRating.value,
                    response.normsVersion,
                ),
            );
        }

        return ratings;
    }

    public async getCatalogue(): Promise<Catalogue> {
        const response = await this.client.getCatalogue();

        return {
            matchStatisticTypes: response.matchStatistics.map((type) =>
                MatchStatisticType.create(
                    type.name,
                    type.displayName,
                    type.description,
                    type.targetEntityType as EntityType,
                ),
            ),
            playerRatingTypes: response.playerRatings.map((type) =>
                PlayerRatingType.create(
                    type.name,
                    type.displayName,
                    type.description,
                    type.kind as RatingKind,
                ),
            ),
            ratingNormsVersion: response.ratingNormsVersion,
        };
    }
}
