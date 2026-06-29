import { PlayerRatingType } from "@/contexts/statistic/domain/models/player-rating";
import { PlayerRatingTypeRepository } from "@/contexts/statistic/domain/repositories/player-rating-type-repository";

export function createInMemoryPlayerRatingTypeRepository(): {
    repository: PlayerRatingTypeRepository;
    count: () => number;
} {
    const types = new Map<string, PlayerRatingType>();

    return {
        repository: {
            findByName: async (name) => types.get(name) ?? null,
            save: async (playerRatingType) => {
                types.set(playerRatingType.getName(), playerRatingType);
            },
        },
        count: () => types.size,
    };
}
