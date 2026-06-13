import { Player } from "@/domain/player/models/player";

export interface PlayerRepository {
    findById(playerId: string): Promise<Player | null>;
    save(player: Player): Promise<void>;
}
