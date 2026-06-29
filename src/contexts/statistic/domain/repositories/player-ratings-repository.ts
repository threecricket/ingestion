import { PlayerRating } from "../models/player-rating";

export interface PlayerRatingsRepository {
    save(playerRating: PlayerRating): Promise<void>;
}
