import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";

export class PlayerBallsBowledStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_balls_bowled",
        "Balls Bowled",
        "Deliveries bowled by bowler",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerBallsBowledStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const ballsBowledByPlayer = new Map<string, number>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                const bowlerId = ball.getBowlerId();
                ballsBowledByPlayer.set(bowlerId, (ballsBowledByPlayer.get(bowlerId) ?? 0) + 1);
            }
        }

        return [...ballsBowledByPlayer.entries()]
            .filter(([, ballsBowled]) => ballsBowled > 0)
            .map(([playerId, ballsBowled]) => this.createStatistic(match, playerId, ballsBowled));
    }
}
