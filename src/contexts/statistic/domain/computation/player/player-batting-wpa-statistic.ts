import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer, MatchStatisticComputeContext } from "../match-statistic-computer";
import { isLegalDelivery } from "../shared/ball-utils";
import { flattenMatchBalls } from "../shared/flatten-match-balls";
import { isWinProbabilitySupportedFormat } from "../shared/supported-formats";
import { computeBallImpacts } from "../shared/wpa-utils";

export class PlayerBattingWpaStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_batting_wpa",
        "Batting WPA",
        "Win probability added by batter (T20/ODI)",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerBattingWpaStatistic.TYPE;
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

        const { battingImpact } = computeBallImpacts(winProbabilities);
        const wpaByPlayer = new Map<string, number>();
        const ballsFacedByPlayer = new Map<string, number>();

        for (const { index, ball } of flattenedBalls) {
            if (!isLegalDelivery(ball)) {
                continue;
            }

            const batterId = ball.getBatterId();
            wpaByPlayer.set(batterId, (wpaByPlayer.get(batterId) ?? 0) + battingImpact[index]);
            ballsFacedByPlayer.set(batterId, (ballsFacedByPlayer.get(batterId) ?? 0) + 1);
        }

        return [...wpaByPlayer.entries()]
            .filter(([playerId]) => (ballsFacedByPlayer.get(playerId) ?? 0) > 0)
            .map(([playerId, wpa]) => this.createStatistic(match, playerId, wpa));
    }
}
