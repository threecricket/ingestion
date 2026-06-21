import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";
import { isLegalDelivery } from "../helpers/ball-utils";

export class PlayerRunsScoredStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_runs_scored",
        "Runs Scored",
        "Runs scored by batter",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerRunsScoredStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const runsByPlayer = new Map<string, number>();
        const ballsFacedByPlayer = new Map<string, number>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                const result = ball.getBallResult();
                const batterId = ball.getBatterId();
                runsByPlayer.set(batterId, (runsByPlayer.get(batterId) ?? 0) + result.getRuns());
                if (isLegalDelivery(ball)) {
                    ballsFacedByPlayer.set(batterId, (ballsFacedByPlayer.get(batterId) ?? 0) + 1);
                }
            }
        }

        return [...runsByPlayer.entries()]
            .filter(([playerId]) => (ballsFacedByPlayer.get(playerId) ?? 0) > 0)
            .map(([playerId, runs]) => this.createStatistic(match, playerId, runs));
    }
}
