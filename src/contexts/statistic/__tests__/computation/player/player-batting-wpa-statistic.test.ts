import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Match, MatchFormat } from "@/contexts/match/domain/models/match";
import { PlayerBattingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-batting-wpa-statistic";
import { WinProbabilityPredictor } from "@/contexts/statistic/domain/ports/win-probability-predictor";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

class StubWinProbabilityPredictor implements WinProbabilityPredictor {
    public constructor(private readonly winProbabilities: number[]) {}

    public async prepare(): Promise<void> {}

    public async predictForMatch(_match: Match): Promise<number[]> {
        return this.winProbabilities;
    }
}

describe("PlayerBattingWpaStatistic", () => {
    it("aggregates batting impact for legal deliveries faced", async () => {
        const computer = new PlayerBattingWpaStatistic(
            new StubWinProbabilityPredictor([0.4, 0.5, 0.3, 0.35]),
        );
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

        const statistics = await computer.compute(match);

        const byPlayer = new Map(statistics.map((stat) => [stat.getEntityId(), stat.getValue()]));
        // batter-a: +0.1 (ball 1) plus the final ball, which jumps to the realised outcome.
        // The batting team is not the match winner, so the terminal win probability is 0:
        // (0 - 0.35) = -0.35, totalling -0.25. The wide is excluded as a non-legal delivery.
        assert.ok(Math.abs((byPlayer.get("batter-a") ?? 0) + 0.25) < 1e-9);
        assert.equal(byPlayer.get("batter-b"), -0.2);
        assert.equal(statistics.length, 2);
    });

    it("returns no statistics for Test matches", async () => {
        const computer = new PlayerBattingWpaStatistic(new StubWinProbabilityPredictor([0.4]));
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

        const statistics = await computer.compute(match);

        assert.deepEqual(statistics, []);
    });

    it("returns no statistics without a predictor", async () => {
        const computer = new PlayerBattingWpaStatistic();
        const match = buildTestMatch({
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [{ batterId: "batter-a", bowlerId: "bowler-1" }],
                },
            ],
        });

        const statistics = await computer.compute(match);

        assert.deepEqual(statistics, []);
    });
});
