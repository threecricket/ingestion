import { PlayerRatingType } from "../models/player-rating";

export interface PlayerRatingTypeRepository {
    findByName(name: string): Promise<PlayerRatingType | null>;
    save(playerRatingType: PlayerRatingType): Promise<void>;
}
