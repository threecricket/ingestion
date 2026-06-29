import {
    RatingNormsArtifact,
    RatingNormsWriter,
} from "@/contexts/statistic/domain/ports/rating-norms-writer";
import { PlayerStatisticsQueryRepository } from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";

const SCHEMA_VERSION = 1;

export interface PublishRatingNormsResult {
    version: string;
    formatCount: number;
    distributionCount: number;
}

export class PublishRatingNormsUseCase {
    public constructor(
        private readonly queryRepository: PlayerStatisticsQueryRepository,
        private readonly writer: RatingNormsWriter,
        private readonly windowDays: number,
    ) {}

    public async execute(now: Date = new Date()): Promise<PublishRatingNormsResult> {
        const windowStart = new Date(now.getTime() - this.windowDays * 24 * 60 * 60 * 1000);
        const norms = await this.queryRepository.aggregatePlayerNorms(windowStart);

        const formats: RatingNormsArtifact["formats"] = {};
        for (const norm of norms) {
            const byStatistic = formats[norm.format] ?? {};
            byStatistic[norm.statisticName] = {
                mean: norm.mean,
                stdDev: norm.stdDev,
                sampleSize: norm.sampleSize,
            };
            formats[norm.format] = byStatistic;
        }

        const artifact: RatingNormsArtifact = {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: now.toISOString(),
            formats,
        };

        const version = await this.writer.write(artifact);

        return {
            version,
            formatCount: Object.keys(formats).length,
            distributionCount: norms.length,
        };
    }
}
