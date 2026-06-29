import { eq } from "drizzle-orm";
import { PlayerRatingType, RatingKind } from "@/contexts/statistic/domain/models/player-rating";
import { PlayerRatingTypeRepository } from "@/contexts/statistic/domain/repositories/player-rating-type-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { playerRatingTypes } from "@/contexts/statistic/infrastructure/postgres/schema";

type PlayerRatingTypeRow = typeof playerRatingTypes.$inferSelect;

export class PostgresPlayerRatingTypeRepository implements PlayerRatingTypeRepository {
    public constructor(private readonly db: Database) {}

    public async findByName(name: string): Promise<PlayerRatingType | null> {
        const rows = await this.db
            .select()
            .from(playerRatingTypes)
            .where(eq(playerRatingTypes.name, name))
            .limit(1);

        const row = rows[0];
        return row ? this.toPlayerRatingType(row) : null;
    }

    public async save(playerRatingType: PlayerRatingType): Promise<void> {
        await this.db
            .insert(playerRatingTypes)
            .values(this.fromPlayerRatingType(playerRatingType))
            .onConflictDoUpdate({
                target: playerRatingTypes.name,
                set: {
                    displayName: playerRatingType.getDisplayName(),
                    description: playerRatingType.getDescription(),
                    kind: playerRatingType.getKind(),
                },
            });
    }

    private toPlayerRatingType(row: PlayerRatingTypeRow): PlayerRatingType {
        return PlayerRatingType.create(
            row.name,
            row.displayName,
            row.description,
            row.kind as RatingKind,
        );
    }

    private fromPlayerRatingType(playerRatingType: PlayerRatingType) {
        return {
            name: playerRatingType.getName(),
            displayName: playerRatingType.getDisplayName(),
            description: playerRatingType.getDescription(),
            kind: playerRatingType.getKind(),
        };
    }
}
