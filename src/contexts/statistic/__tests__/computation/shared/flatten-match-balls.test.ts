import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { flattenMatchBalls } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { isWinProbabilitySupportedFormat } from "@/contexts/statistic/domain/computation/shared/supported-formats";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

describe("flatten-match-balls", () => {
    it("flattens deliveries in innings order", () => {
        const match = buildTestMatch({
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [
                        { batterId: "batter-1", bowlerId: "bowler-1" },
                        { batterId: "batter-1", bowlerId: "bowler-1" },
                    ],
                },
                {
                    inningNumber: 2,
                    battingTeamId: "bowling-team",
                    bowlingTeamId: "batting-team",
                    deliveries: [{ batterId: "batter-2", bowlerId: "bowler-2" }],
                },
            ],
        });

        const flattened = flattenMatchBalls(match);

        assert.equal(flattened.length, 3);
        assert.equal(flattened[0].index, 0);
        assert.equal(flattened[2].index, 2);
        assert.equal(flattened[2].inning.getInningNumber(), 2);
    });
});

describe("supported-formats", () => {
    it("supports only T20 and ODI formats", () => {
        assert.equal(isWinProbabilitySupportedFormat(MatchFormat.T20), true);
        assert.equal(isWinProbabilitySupportedFormat(MatchFormat.ODI), true);
        assert.equal(isWinProbabilitySupportedFormat(MatchFormat.TEST), false);
    });
});
