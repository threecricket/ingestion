import { Player } from "@/domain/player/models/player";

export interface PlayerRepository {
    findById(playerId: string): Player | null;
    save(player: Player): void;
}
