import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";
import { runsOnDelivery } from "../shared/ball-utils";

export class PlayerRunsConcededStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_runs_conceded",
        "Runs Conceded",
        "Runs conceded by bowler",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerRunsConcededStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const runsConcededByPlayer = new Map<string, number>();
        const ballsBowledByPlayer = new Map<string, number>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                const bowlerId = ball.getBowlerId();
                ballsBowledByPlayer.set(bowlerId, (ballsBowledByPlayer.get(bowlerId) ?? 0) + 1);
                runsConcededByPlayer.set(
                    bowlerId,
                    (runsConcededByPlayer.get(bowlerId) ?? 0) + runsOnDelivery(ball),
                );
            }
        }

        return [...ballsBowledByPlayer.entries()]
            .filter(([, ballsBowled]) => ballsBowled > 0)
            .map(([playerId]) => this.createStatistic(match, playerId, runsConcededByPlayer.get(playerId) ?? 0));
    }
}
