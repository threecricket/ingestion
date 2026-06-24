import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer, MatchStatisticComputeContext } from "../match-statistic-computer";
import { flattenMatchBalls } from "../shared/flatten-match-balls";
import { isWinProbabilitySupportedFormat } from "../shared/supported-formats";
import { computeBallImpacts } from "../shared/wpa-utils";

export class PlayerBowlingWpaStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_bowling_wpa",
        "Bowling WPA",
        "Win probability added by bowler (T20/ODI)",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerBowlingWpaStatistic.TYPE;
    }

    public compute(match: Match, context?: MatchStatisticComputeContext): MatchStatistic[] {
        if (!isWinProbabilitySupportedFormat(match.getMatchFormat())) {
            return [];
        }

        const winProbabilities = context?.winProbabilityByBallIndex;
        if (!winProbabilities || winProbabilities.length === 0) {
            return [];
        }

        const flattenedBalls = flattenMatchBalls(match);
        if (winProbabilities.length !== flattenedBalls.length) {
            throw new Error(
                `Win probability count (${winProbabilities.length}) does not match delivery count (${flattenedBalls.length})`,
            );
        }

        const { bowlingImpact } = computeBallImpacts(winProbabilities);
        const wpaByPlayer = new Map<string, number>();
        const ballsBowledByPlayer = new Map<string, number>();

        for (const { index, ball } of flattenedBalls) {
            const bowlerId = ball.getBowlerId();
            wpaByPlayer.set(bowlerId, (wpaByPlayer.get(bowlerId) ?? 0) + bowlingImpact[index]);
            ballsBowledByPlayer.set(bowlerId, (ballsBowledByPlayer.get(bowlerId) ?? 0) + 1);
        }

        return [...wpaByPlayer.entries()]
            .filter(([playerId]) => (ballsBowledByPlayer.get(playerId) ?? 0) > 0)
            .map(([playerId, wpa]) => this.createStatistic(match, playerId, wpa));
    }
}
