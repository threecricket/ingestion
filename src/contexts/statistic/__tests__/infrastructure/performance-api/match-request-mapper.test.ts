import assert from "node:assert/strict";
import { test } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { toComputeMatchStatisticsRequest } from "@/contexts/statistic/infrastructure/performance-api/match-request-mapper";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

test("maps a match aggregate to the compute-match-statistics request body", () => {
    const match = buildTestMatch({
        format: MatchFormat.T20,
        innings: [
            {
                inningNumber: 1,
                battingTeamId: "team-1-id",
                bowlingTeamId: "team-2-id",
                target: null,
                deliveries: [
                    { batterId: "batter-1", bowlerId: "bowler-1", runs: 4 },
                    { batterId: "batter-1", bowlerId: "bowler-1", runs: 0, wide: true },
                ],
            },
        ],
    });

    const players = {
        "batter-1": { battingHand: "right-hand", bowlingHand: null, bowlingStyle: null },
    };

    const request = toComputeMatchStatisticsRequest(match, players);

    assert.equal(request.match.matchId, "match-id");
    assert.equal(request.match.format, "t20");
    assert.equal(typeof request.match.startDate, "string");
    assert.equal(request.match.innings.length, 1);
    assert.equal(request.match.innings[0].ballList.length, 2);

    const firstBall = request.match.innings[0].ballList[0];
    assert.equal(firstBall.batterId, "batter-1");
    assert.equal(firstBall.bowlerId, "bowler-1");
    assert.equal(firstBall.result.runs, 4);
    assert.equal(firstBall.result.wide, false);

    const secondBall = request.match.innings[0].ballList[1];
    assert.equal(secondBall.result.wide, true);

    assert.deepEqual(request.players, players);
});
