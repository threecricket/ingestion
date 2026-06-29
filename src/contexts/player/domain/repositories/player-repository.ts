import { Player } from "@/contexts/player/domain/models/player";

export interface PlayerRepository {
    findById(playerId: string): Promise<Player | null>;
    findByIds(playerIds: string[]): Promise<Player[]>;
    save(player: Player): Promise<void>;
}
