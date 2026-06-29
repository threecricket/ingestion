import assert from "node:assert/strict";
import { test } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { RatingKind } from "@/contexts/statistic/domain/models/player-rating";
import { PerformanceApiClient } from "@/contexts/statistic/infrastructure/performance-api/performance-api-client";
import { PerformanceApiGateway } from "@/contexts/statistic/infrastructure/performance-api/performance-api-gateway";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

function createGateway(overrides: Partial<PerformanceApiClient>): PerformanceApiGateway {
    return new PerformanceApiGateway(overrides as unknown as PerformanceApiClient);
}

test("maps compute-match-statistics responses to MatchStatistic domain objects", async () => {
    const gateway = createGateway({
        computeMatchStatistics: async () => ({
            statistics: [
                {
                    matchId: "match-id",
                    statisticTypeName: "player_runs_scored",
                    entityType: "player",
                    entityId: "batter-1",
                    value: 42,
                },
            ],
        }),
    });

    const match = buildTestMatch({
        format: MatchFormat.T20,
        innings: [
            {
                inningNumber: 1,
                battingTeamId: "team-1-id",
                bowlingTeamId: "team-2-id",
                deliveries: [{ batterId: "batter-1", bowlerId: "bowler-1", runs: 4 }],
            },
        ],
    });

    const statistics = await gateway.computeMatchStatistics(match, {});

    assert.equal(statistics.length, 1);
    assert.equal(statistics[0].getStatisticTypeName(), "player_runs_scored");
    assert.equal(statistics[0].getEntityType(), EntityType.PLAYER);
    assert.equal(statistics[0].getValue(), 42);
});

test("maps compute-player-ratings responses to overall + sub PlayerRating objects", async () => {
    const gateway = createGateway({
        computePlayerRatings: async () => ({
            playerId: "player-1",
            overallRating: 61.5,
            subRatings: [
                { name: "batting", displayName: "Batting", value: 70 },
                { name: "bowling", displayName: "Bowling", value: 50 },
            ],
            normsVersion: "2024-01-01T00:00:00.000Z",
        }),
    });

    const ratings = await gateway.computePlayerRatings("player-1", []);

    assert.equal(ratings.length, 3);
    assert.equal(ratings[0].getRatingName(), "overall");
    assert.equal(ratings[0].getValue(), 61.5);
    assert.equal(ratings[0].getNormsVersion(), "2024-01-01T00:00:00.000Z");
    assert.deepEqual(
        ratings.map((rating) => rating.getRatingName()),
        ["overall", "batting", "bowling"],
    );
});

test("maps catalogue responses to domain types", async () => {
    const gateway = createGateway({
        getCatalogue: async () => ({
            matchStatistics: [
                {
                    name: "player_runs_scored",
                    displayName: "Runs scored",
                    description: "Runs scored by a batter",
                    targetEntityType: "player",
                },
            ],
            playerRatings: [
                { name: "overall", displayName: "Overall", description: "Overall rating", kind: "overall" },
            ],
            ratingNormsVersion: "v1",
        }),
    });

    const catalogue = await gateway.getCatalogue();

    assert.equal(catalogue.matchStatisticTypes.length, 1);
    assert.equal(catalogue.matchStatisticTypes[0].getTargetEntityType(), EntityType.PLAYER);
    assert.equal(catalogue.playerRatingTypes[0].getKind(), RatingKind.OVERALL);
    assert.equal(catalogue.ratingNormsVersion, "v1");
});
