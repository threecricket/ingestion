import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { flattenMatchBalls } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { buildWinProbabilityFeatures } from "@/contexts/statistic/infrastructure/model-api/win-probability-feature-mapper";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

describe("win-probability-feature-mapper", () => {
    it("builds feature arrays aligned with model-api innings state strategies", () => {
        const match = buildTestMatch({
            format: MatchFormat.T20,
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [
                        { batterId: "batter-1", bowlerId: "bowler-1", teamRuns: 10, teamWickets: 0, ballNumber: 5 },
                        { batterId: "batter-1", bowlerId: "bowler-1", teamRuns: 14, teamWickets: 1, ballNumber: 6 },
                    ],
                },
                {
                    inningNumber: 2,
                    battingTeamId: "bowling-team",
                    bowlingTeamId: "batting-team",
                    target: 50,
                    deliveries: [
                        { batterId: "batter-2", bowlerId: "bowler-2", teamRuns: 20, teamWickets: 0, ballNumber: 10 },
                    ],
                },
            ],
        });

        const flattened = flattenMatchBalls(match);
        const features = buildWinProbabilityFeatures(match, flattened);

        assert.equal(features.current_innings_runs.length, 3);
        assert.deepEqual(features.current_innings_runs, [10, 14, 20]);
        assert.deepEqual(features.current_innings_wickets, [0, 1, 0]);
        assert.deepEqual(features.current_innings_legal_balls_remaining, [116, 115, 111]);
        assert.deepEqual(features.current_innings_target, [0, 0, 50]);
        assert.deepEqual(features.current_innings_runs_required, [0, 0, 30]);
    });
});
