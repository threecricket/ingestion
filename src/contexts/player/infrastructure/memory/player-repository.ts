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
            save: async (player) => { players.set(player.getPlayerId(), player); },
        },
        count: () => players.size,
    };
}
