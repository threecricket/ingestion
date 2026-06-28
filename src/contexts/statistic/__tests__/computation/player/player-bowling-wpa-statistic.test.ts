import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Match, MatchFormat } from "@/contexts/match/domain/models/match";
import { PlayerBowlingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-bowling-wpa-statistic";
import { WinProbabilityPredictor } from "@/contexts/statistic/domain/ports/win-probability-predictor";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

class StubWinProbabilityPredictor implements WinProbabilityPredictor {
    public constructor(private readonly winProbabilities: number[]) {}

    public async prepare(): Promise<void> {}

    public async predictForMatch(_match: Match): Promise<number[]> {
        return this.winProbabilities;
    }
}

describe("PlayerBowlingWpaStatistic", () => {
    it("aggregates bowling impact for all deliveries bowled", async () => {
        const computer = new PlayerBowlingWpaStatistic(
            new StubWinProbabilityPredictor([0.4, 0.5, 0.3]),
        );
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

        const statistics = await computer.compute(match);

        assert.equal(statistics.length, 1);
        assert.equal(statistics[0].getEntityId(), "bowler-1");
        // bowling impact is the negative of batting impact, summed across all deliveries
        // (including the wide): -0.1 + 0.2 plus the final ball, which jumps to the realised
        // outcome (batting team did not win => terminal 0): -(0 - 0.3) = 0.3, totalling 0.4.
        assert.ok(Math.abs(statistics[0].getValue() - 0.4) < 1e-9);
    });

    it("returns no statistics for Test matches", async () => {
        const computer = new PlayerBowlingWpaStatistic(new StubWinProbabilityPredictor([0.4]));
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
        const computer = new PlayerBowlingWpaStatistic();
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
