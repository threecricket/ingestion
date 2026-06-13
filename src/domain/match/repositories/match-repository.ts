import { Match } from "@/domain/match/models/match";

export interface MatchRepository {
    findById(matchId: string): Match | null;
    save(match: Match): void;
}
