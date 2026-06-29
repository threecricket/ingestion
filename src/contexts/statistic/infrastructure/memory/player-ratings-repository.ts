import { PlayerRating } from "@/contexts/statistic/domain/models/player-rating";
import { PlayerRatingsRepository } from "@/contexts/statistic/domain/repositories/player-ratings-repository";

function toKey(playerId: string, ratingName: string): string {
    return `${playerId}:${ratingName}`;
}

export function createInMemoryPlayerRatingsRepository(): {
    repository: PlayerRatingsRepository;
    count: () => number;
} {
    const ratings = new Map<string, PlayerRating>();

    return {
        repository: {
            save: async (playerRating) => {
                ratings.set(
                    toKey(playerRating.getPlayerId(), playerRating.getRatingName()),
                    playerRating,
                );
            },
        },
        count: () => ratings.size,
    };
}
