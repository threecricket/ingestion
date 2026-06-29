import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import {
    PlayerNorm,
    PlayerStatisticRecord,
    PlayerStatisticsQueryRepository,
} from "@/contexts/statistic/domain/repositories/player-statistics-query-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { matchStatistics } from "@/contexts/statistic/infrastructure/postgres/schema";
import { matches } from "@/contexts/match/infrastructure/postgres/schema";

export class PostgresPlayerStatisticsQueryRepository implements PlayerStatisticsQueryRepository {
    public constructor(private readonly db: Database) {}

    public async aggregatePlayerNorms(windowStart: Date): Promise<PlayerNorm[]> {
        const rows = await this.db
            .select({
                format: matches.format,
                statisticName: matchStatistics.statisticTypeName,
                mean: sql<string>`avg(${matchStatistics.value})`,
                stdDev: sql<string>`coalesce(stddev_samp(${matchStatistics.value}), 0)`,
                sampleSize: sql<string>`count(*)`,
            })
            .from(matchStatistics)
            .innerJoin(matches, eq(matchStatistics.matchId, matches.id))
            .where(
                and(
                    eq(matchStatistics.entityType, EntityType.PLAYER),
                    gte(matches.startDate, windowStart),
                ),
            )
            .groupBy(matches.format, matchStatistics.statisticTypeName);

        return rows.map((row) => ({
            format: row.format,
            statisticName: row.statisticName,
            mean: Number(row.mean),
            stdDev: Number(row.stdDev),
            sampleSize: Number(row.sampleSize),
        }));
    }

    public async findPlayerStatistics(playerIds: string[]): Promise<PlayerStatisticRecord[]> {
        if (playerIds.length === 0) {
            return [];
        }

        const rows = await this.db
            .select({
                playerId: matchStatistics.entityId,
                matchId: matchStatistics.matchId,
                format: matches.format,
                statisticName: matchStatistics.statisticTypeName,
                value: matchStatistics.value,
            })
            .from(matchStatistics)
            .innerJoin(matches, eq(matchStatistics.matchId, matches.id))
            .where(
                and(
                    eq(matchStatistics.entityType, EntityType.PLAYER),
                    inArray(matchStatistics.entityId, playerIds),
                ),
            );

        return rows.map((row) => ({
            playerId: row.playerId,
            matchId: row.matchId,
            format: row.format,
            statisticName: row.statisticName,
            value: row.value,
        }));
    }

    public async findAllPlayerIds(): Promise<string[]> {
        const rows = await this.db
            .selectDistinct({ playerId: matchStatistics.entityId })
            .from(matchStatistics)
            .where(eq(matchStatistics.entityType, EntityType.PLAYER));

        return rows.map((row) => row.playerId);
    }
}
