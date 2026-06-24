import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { PlayerBowlingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-bowling-wpa-statistic";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

describe("PlayerBowlingWpaStatistic", () => {
    const computer = new PlayerBowlingWpaStatistic();

    it("aggregates bowling impact for all deliveries bowled", () => {
        const match = buildTestMatch({
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [
                        { batterId: "batter-a", bowlerId: "bowler-1" },
                        { batterId: "batter-a", bowlerId: "bowler-1", wide: true },
                        { batterId: "batter-b", bowlerId: "bowler-1" },
                    ],
                },
            ],
        });

        const statistics = computer.compute(match, {
            winProbabilityByBallIndex: [0.4, 0.5, 0.3],
        });

        assert.equal(statistics.length, 1);
        assert.equal(statistics[0].getEntityId(), "bowler-1");
        assert.ok(Math.abs(statistics[0].getValue() - 0.1) < 1e-9);
    });

    it("returns no statistics for Test matches", () => {
        const match = buildTestMatch({
            format: MatchFormat.TEST,
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [{ batterId: "batter-a", bowlerId: "bowler-1" }],
                },
            ],
        });

        const statistics = computer.compute(match, {
            winProbabilityByBallIndex: [0.4],
        });

        assert.deepEqual(statistics, []);
    });
});
