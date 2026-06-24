import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";
import { isBowlerWicket } from "../shared/ball-utils";

export class PlayerWicketsTakenStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_wickets_taken",
        "Wickets Taken",
        "Wickets taken by bowler",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerWicketsTakenStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const wicketsByBowler = new Map<string, number>();
        const ballsBowledByPlayer = new Map<string, number>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                const result = ball.getBallResult();
                const bowlerId = ball.getBowlerId();
                ballsBowledByPlayer.set(bowlerId, (ballsBowledByPlayer.get(bowlerId) ?? 0) + 1);

                if (result.getOut()) {
                    const wicketType = result.getWicketType();
                    if (wicketType && isBowlerWicket(wicketType)) {
                        wicketsByBowler.set(bowlerId, (wicketsByBowler.get(bowlerId) ?? 0) + 1);
                    }
                }
            }
        }

        return [...ballsBowledByPlayer.entries()]
            .filter(([, ballsBowled]) => ballsBowled > 0)
            .map(([playerId]) => this.createStatistic(match, playerId, wicketsByBowler.get(playerId) ?? 0));
    }
}
