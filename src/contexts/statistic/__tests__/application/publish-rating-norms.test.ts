import assert from "node:assert/strict";
import { test } from "node:test";
import { PublishRatingNormsUseCase } from "@/contexts/statistic/application/publish-rating-norms";
import { RatingNormsArtifact } from "@/contexts/statistic/domain/ports/rating-norms-writer";
import {
    PlayerNorm,
    PlayerStatisticRecord,
    PlayerStatisticsQueryRepository,
} from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";

class FakeQueryRepository implements PlayerStatisticsQueryRepository {
    public windowStart: Date | null = null;

    public constructor(private readonly norms: PlayerNorm[]) {}

    public async aggregatePlayerNorms(windowStart: Date): Promise<PlayerNorm[]> {
        this.windowStart = windowStart;
        return this.norms;
    }

    public async findPlayerStatistics(): Promise<PlayerStatisticRecord[]> {
        return [];
    }

    public async findAllPlayerIds(): Promise<string[]> {
        return [];
    }
}

test("builds and writes a rating-norms artifact grouped by format and statistic", async () => {
    const queryRepository = new FakeQueryRepository([
        { format: "t20", statisticName: "player_runs_scored", mean: 20, stdDev: 5, sampleSize: 100 },
        { format: "t20", statisticName: "player_balls_faced", mean: 15, stdDev: 4, sampleSize: 100 },
        { format: "odi", statisticName: "player_runs_scored", mean: 35, stdDev: 9, sampleSize: 50 },
    ]);

    let written: RatingNormsArtifact | null = null;
    const writer = {
        write: async (artifact: RatingNormsArtifact) => {
            written = artifact;
            return artifact.updatedAt;
        },
    };

    const useCase = new PublishRatingNormsUseCase(queryRepository, writer, 730);
    const now = new Date("2024-06-01T00:00:00.000Z");
    const result = await useCase.execute(now);

    assert.equal(result.version, "2024-06-01T00:00:00.000Z");
    assert.equal(result.formatCount, 2);
    assert.equal(result.distributionCount, 3);

    assert.ok(written);
    const artifact = written as RatingNormsArtifact;
    assert.equal(artifact.schemaVersion, 1);
    assert.equal(artifact.formats.t20.player_runs_scored.mean, 20);
    assert.equal(artifact.formats.t20.player_balls_faced.stdDev, 4);
    assert.equal(artifact.formats.odi.player_runs_scored.sampleSize, 50);

    const expectedWindowStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
    assert.equal(queryRepository.windowStart?.toISOString(), expectedWindowStart.toISOString());
});
