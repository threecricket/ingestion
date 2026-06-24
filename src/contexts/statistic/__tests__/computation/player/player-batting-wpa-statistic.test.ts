import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { PlayerBattingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-batting-wpa-statistic";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

describe("PlayerBattingWpaStatistic", () => {
    const computer = new PlayerBattingWpaStatistic();

    it("aggregates batting impact for legal deliveries faced", () => {
        const match = buildTestMatch({
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [
                        { batterId: "batter-a", bowlerId: "bowler-1" },
                        { batterId: "batter-b", bowlerId: "bowler-1" },
                        { batterId: "batter-a", bowlerId: "bowler-1", wide: true },
                        { batterId: "batter-a", bowlerId: "bowler-1" },
                    ],
                },
            ],
        });

        const statistics = computer.compute(match, {
            winProbabilityByBallIndex: [0.4, 0.5, 0.3, 0.35],
        });

        const byPlayer = new Map(statistics.map((stat) => [stat.getEntityId(), stat.getValue()]));
        assert.ok(Math.abs((byPlayer.get("batter-a") ?? 0) - 0.1) < 1e-9);
        assert.equal(byPlayer.get("batter-b"), -0.2);
        assert.equal(statistics.length, 2);
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
