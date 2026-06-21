import { eq } from "drizzle-orm";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { MatchStatisticType } from "@/contexts/statistic/domain/models/match-statistic";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repository/match-statistic-type-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { matchStatisticTypes } from "@/contexts/statistic/infrastructure/postgres/schema";

type MatchStatisticTypeRow = typeof matchStatisticTypes.$inferSelect;

export class PostgresMatchStatisticTypeRepository implements MatchStatisticTypeRepository {
    public constructor(private readonly db: Database) {}

    public async findByName(name: string): Promise<MatchStatisticType | null> {
        const rows = await this.db
            .select()
            .from(matchStatisticTypes)
            .where(eq(matchStatisticTypes.name, name))
            .limit(1);

        const row = rows[0];
        return row ? this.toMatchStatisticType(row) : null;
    }

    public async save(matchStatisticType: MatchStatisticType): Promise<void> {
        await this.db
            .insert(matchStatisticTypes)
            .values(this.fromMatchStatisticType(matchStatisticType))
            .onConflictDoUpdate({
                target: matchStatisticTypes.name,
                set: {
                    displayName: matchStatisticType.getDisplayName(),
                    description: matchStatisticType.getDescription(),
                    targetEntityType: matchStatisticType.getTargetEntityType(),
                },
            });
    }

    private toMatchStatisticType(row: MatchStatisticTypeRow): MatchStatisticType {
        return MatchStatisticType.create(
            row.name,
            row.displayName,
            row.description,
            row.targetEntityType as EntityType,
        );
    }

    private fromMatchStatisticType(matchStatisticType: MatchStatisticType) {
        return {
            name: matchStatisticType.getName(),
            displayName: matchStatisticType.getDisplayName(),
            description: matchStatisticType.getDescription(),
            targetEntityType: matchStatisticType.getTargetEntityType(),
        };
    }
}
