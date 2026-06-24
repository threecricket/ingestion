import { and, eq } from "drizzle-orm";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { MatchStatistic } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticsRepository } from "@/contexts/statistic/domain/repositories/match-statistics-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { matchStatistics } from "@/contexts/statistic/infrastructure/postgres/schema";

type MatchStatisticRow = typeof matchStatistics.$inferSelect;

export class PostgresMatchStatisticsRepository implements MatchStatisticsRepository {
    public constructor(private readonly db: Database) {}

    public async findByMatchIdAndStatisticTypeNameAndEntityId(
        matchId: string,
        statisticTypeName: string,
        entityId: string,
    ): Promise<MatchStatistic | null> {
        const rows = await this.db
            .select()
            .from(matchStatistics)
            .where(
                and(
                    eq(matchStatistics.matchId, matchId),
                    eq(matchStatistics.statisticTypeName, statisticTypeName),
                    eq(matchStatistics.entityId, entityId),
                ),
            )
            .limit(1);

        const row = rows[0];
        return row ? this.toMatchStatistic(row) : null;
    }

    public async save(matchStatistic: MatchStatistic): Promise<void> {
        await this.db
            .insert(matchStatistics)
            .values(this.fromMatchStatistic(matchStatistic))
            .onConflictDoUpdate({
                target: [
                    matchStatistics.matchId,
                    matchStatistics.statisticTypeName,
                    matchStatistics.entityId,
                ],
                set: {
                    entityType: matchStatistic.getEntityType(),
                    value: matchStatistic.getValue(),
                },
            });
    }

    private toMatchStatistic(row: MatchStatisticRow): MatchStatistic {
        return MatchStatistic.create(
            row.matchId,
            row.statisticTypeName,
            row.entityType as EntityType,
            row.entityId,
            row.value,
        );
    }

    private fromMatchStatistic(matchStatistic: MatchStatistic) {
        return {
            matchId: matchStatistic.getMatchId(),
            statisticTypeName: matchStatistic.getStatisticTypeName(),
            entityType: matchStatistic.getEntityType(),
            entityId: matchStatistic.getEntityId(),
            value: matchStatistic.getValue(),
        };
    }
}
