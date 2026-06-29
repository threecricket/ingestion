import assert from "node:assert/strict";
import { test } from "node:test";
import { ComputePlayerRatingsUseCase } from "@/contexts/statistic/application/compute-player-ratings";
import { PlayerRating } from "@/contexts/statistic/domain/models/player-rating";
import {
    Catalogue,
    PerformanceGateway,
    PlayerMatchStatisticInput,
} from "@/contexts/statistic/domain/ports/performance-gateway";
import { PlayerRatingsRepository } from "@/contexts/statistic/domain/repositories/player-ratings-repository";
import {
    PlayerNorm,
    PlayerStatisticRecord,
    PlayerStatisticsQueryRepository,
} from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";

class FakeQueryRepository implements PlayerStatisticsQueryRepository {
    public constructor(private readonly records: PlayerStatisticRecord[]) {}

    public async aggregatePlayerNorms(): Promise<PlayerNorm[]> {
        return [];
    }

    public async findPlayerStatistics(playerIds: string[]): Promise<PlayerStatisticRecord[]> {
        return this.records.filter((record) => playerIds.includes(record.playerId));
    }

    public async findAllPlayerIds(): Promise<string[]> {
        return [...new Set(this.records.map((record) => record.playerId))];
    }
}

class FakeGateway implements PerformanceGateway {
    public received: { playerId: string; statistics: PlayerMatchStatisticInput[] }[] = [];

    public async computeMatchStatistics(): Promise<never[]> {
        return [];
    }

    public async computePlayerRatings(
        playerId: string,
        statistics: PlayerMatchStatisticInput[],
    ): Promise<PlayerRating[]> {
        this.received.push({ playerId, statistics });
        return [
            PlayerRating.create(playerId, "overall", 55, "v1"),
            PlayerRating.create(playerId, "batting", 60, "v1"),
        ];
    }

    public async getCatalogue(): Promise<Catalogue> {
        return { matchStatisticTypes: [], playerRatingTypes: [], ratingNormsVersion: null };
    }
}

test("gathers per-player statistics, calls the gateway and persists ratings", async () => {
    const queryRepository = new FakeQueryRepository([
        { playerId: "player-1", matchId: "m1", format: "t20", statisticName: "player_runs_scored", value: 40 },
        { playerId: "player-1", matchId: "m2", format: "t20", statisticName: "player_runs_scored", value: 10 },
    ]);
    const gateway = new FakeGateway();

    const saved: PlayerRating[] = [];
    const ratingsRepository: PlayerRatingsRepository = {
        save: async (rating) => { saved.push(rating); },
    };

    const useCase = new ComputePlayerRatingsUseCase(queryRepository, gateway, ratingsRepository);
    const persisted = await useCase.computeForPlayers(["player-1", "player-1"]);

    assert.equal(persisted, 2);
    assert.equal(saved.length, 2);
    assert.equal(gateway.received.length, 1);
    assert.equal(gateway.received[0].playerId, "player-1");
    assert.equal(gateway.received[0].statistics.length, 2);
    assert.deepEqual(saved.map((rating) => rating.getRatingName()), ["overall", "batting"]);
});

test("skips players without statistics", async () => {
    const queryRepository = new FakeQueryRepository([]);
    const gateway = new FakeGateway();
    const ratingsRepository: PlayerRatingsRepository = { save: async () => {} };

    const useCase = new ComputePlayerRatingsUseCase(queryRepository, gateway, ratingsRepository);
    const persisted = await useCase.computeForPlayers(["player-2"]);

    assert.equal(persisted, 0);
    assert.equal(gateway.received.length, 0);
});
