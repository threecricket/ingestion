import { PlayerRating } from "@/contexts/statistic/domain/models/player-rating";
import { PlayerRatingsRepository } from "@/contexts/statistic/domain/repositories/player-ratings-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { playerRatings } from "@/contexts/statistic/infrastructure/postgres/schema";

export class PostgresPlayerRatingsRepository implements PlayerRatingsRepository {
    public constructor(private readonly db: Database) {}

    public async save(playerRating: PlayerRating): Promise<void> {
        await this.db
            .insert(playerRatings)
            .values(this.fromPlayerRating(playerRating))
            .onConflictDoUpdate({
                target: [playerRatings.playerId, playerRatings.ratingName],
                set: {
                    value: playerRating.getValue(),
                    normsVersion: playerRating.getNormsVersion(),
                },
            });
    }

    private fromPlayerRating(playerRating: PlayerRating) {
        return {
            playerId: playerRating.getPlayerId(),
            ratingName: playerRating.getRatingName(),
            value: playerRating.getValue(),
            normsVersion: playerRating.getNormsVersion(),
        };
    }
}
