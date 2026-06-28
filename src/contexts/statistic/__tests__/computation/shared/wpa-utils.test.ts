import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Match, ResultType } from "@/contexts/match/domain/models/match";
import { FlattenedBall } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { computeBallImpacts } from "@/contexts/statistic/domain/computation/shared/wpa-utils";

function expectClose(actual: number, expected: number): void {
    assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to be close to ${expected}`);
}

function flattenedBallsFor(entries: { inning: number; battingTeamId: string }[]): FlattenedBall[] {
    return entries.map((entry, index) => ({
        index,
        ball: {} as FlattenedBall["ball"],
        inning: {
            getInningNumber: () => entry.inning,
            getBattingTeamId: () => entry.battingTeamId,
        } as FlattenedBall["inning"],
    }));
}

function matchWithResult(resultType: ResultType, subjectTeamId: string | null): Match {
    return {
        getMatchResult: () => ({
            getResultType: () => resultType,
            getSubjectTeamId: () => subjectTeamId,
        }),
    } as unknown as Match;
}

describe("wpa-utils", () => {
    it("computes batting and bowling impacts from consecutive win probabilities", () => {
        const flattenedBalls = flattenedBallsFor([
            { inning: 1, battingTeamId: "team-a" },
            { inning: 1, battingTeamId: "team-a" },
            { inning: 1, battingTeamId: "team-a" },
        ]);
        const match = matchWithResult(ResultType.WON, "team-a");

        const impacts = computeBallImpacts([0.4, 0.5, 0.3], flattenedBalls, match);

        expectClose(impacts.battingImpact[0], 0.1);
        expectClose(impacts.battingImpact[1], -0.2);
        // Final delivery jumps to the realised outcome (team-a won => 1.0).
        expectClose(impacts.battingImpact[2], 0.7);
        expectClose(impacts.bowlingImpact[0], -0.1);
        expectClose(impacts.bowlingImpact[1], 0.2);
        expectClose(impacts.bowlingImpact[2], -0.7);
    });

    it("flips perspective at the innings boundary instead of leaking across innings", () => {
        const flattenedBalls = flattenedBallsFor([
            { inning: 1, battingTeamId: "team-a" },
            { inning: 1, battingTeamId: "team-a" },
            { inning: 2, battingTeamId: "team-b" },
            { inning: 2, battingTeamId: "team-b" },
        ]);
        const match = matchWithResult(ResultType.WON, "team-b");

        const impacts = computeBallImpacts([0.4, 0.5, 0.7, 0.6], flattenedBalls, match);

        expectClose(impacts.battingImpact[0], 0.1);
        // Last ball of innings 1: post-ball WP = 1 - 0.7 = 0.3, delta = 0.3 - 0.5.
        expectClose(impacts.battingImpact[1], -0.2);
        expectClose(impacts.battingImpact[2], -0.1);
        // Final delivery: team-b won => 1.0, delta = 1.0 - 0.6.
        expectClose(impacts.battingImpact[3], 0.4);

        expectClose(impacts.bowlingImpact[0], -0.1);
        expectClose(impacts.bowlingImpact[1], 0.2);
        expectClose(impacts.bowlingImpact[2], 0.1);
        expectClose(impacts.bowlingImpact[3], -0.4);
    });

    it("treats a tie as a 0.5 terminal win probability", () => {
        const flattenedBalls = flattenedBallsFor([
            { inning: 2, battingTeamId: "team-b" },
            { inning: 2, battingTeamId: "team-b" },
        ]);
        const match = matchWithResult(ResultType.TIE, null);

        const impacts = computeBallImpacts([0.6, 0.7], flattenedBalls, match);

        expectClose(impacts.battingImpact[0], 0.1);
        // Final delivery: tie => 0.5, delta = 0.5 - 0.7.
        expectClose(impacts.battingImpact[1], -0.2);
    });
});
