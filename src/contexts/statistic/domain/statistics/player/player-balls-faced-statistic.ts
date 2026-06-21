import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";
import { isLegalDelivery } from "../helpers/ball-utils";

export class PlayerBallsFacedStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_balls_faced",
        "Balls Faced",
        "Legal balls faced by batter",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerBallsFacedStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const ballsFacedByPlayer = new Map<string, number>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                if (!isLegalDelivery(ball)) {
                    continue;
                }

                const batterId = ball.getBatterId();
                ballsFacedByPlayer.set(batterId, (ballsFacedByPlayer.get(batterId) ?? 0) + 1);
            }
        }

        return [...ballsFacedByPlayer.entries()]
            .filter(([, ballsFaced]) => ballsFaced > 0)
            .map(([playerId, ballsFaced]) => this.createStatistic(match, playerId, ballsFaced));
    }
}
