import { Player } from "@/contexts/player/domain/models/player";

export interface PlayerRepository {
    findById(playerId: string): Promise<Player | null>;
    save(player: Player): Promise<void>;
}
