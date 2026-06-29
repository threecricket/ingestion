import { Player } from "@/contexts/player/domain/models/player";
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";

export function createInMemoryPlayerRepository(): {
    repository: PlayerRepository;
    count: () => number;
} {
    const players = new Map<string, Player>();

    return {
        repository: {
            findById: async (id) => players.get(id) ?? null,
            findByIds: async (ids) => ids
                .map((id) => players.get(id))
                .filter((player): player is Player => player !== undefined),
            save: async (player) => { players.set(player.getPlayerId(), player); },
        },
        count: () => players.size,
    };
}
