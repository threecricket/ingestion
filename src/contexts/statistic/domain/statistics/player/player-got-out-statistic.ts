import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";
import { isLegalDelivery } from "../helpers/ball-utils";

export class PlayerGotOutStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "player_got_out",
        "Got Out",
        "Whether player was dismissed (1=true, 0=false)",
        EntityType.PLAYER,
    );

    public getType(): MatchStatisticType {
        return PlayerGotOutStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const ballsFacedByPlayer = new Map<string, number>();
        const gotOutByPlayer = new Map<string, boolean>();

        for (const inning of match.getInnings()) {
            for (const ball of inning.getBallList()) {
                const result = ball.getBallResult();
                const batterId = ball.getBatterId();

                if (isLegalDelivery(ball)) {
                    ballsFacedByPlayer.set(batterId, (ballsFacedByPlayer.get(batterId) ?? 0) + 1);
                }

                if (result.getOut()) {
                    const playerOutId = result.getPlayerOutId();
                    if (playerOutId) {
                        gotOutByPlayer.set(playerOutId, true);
                    }
                }
            }
        }

        return [...ballsFacedByPlayer.entries()]
            .filter(([, ballsFaced]) => ballsFaced > 0)
            .map(([playerId]) => this.createStatistic(match, playerId, gotOutByPlayer.get(playerId) ? 1 : 0));
    }
}
