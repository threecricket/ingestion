import { Match } from "@/contexts/match/domain/models/match";

export interface MatchRepository {
    findById(matchId: string): Promise<Match | null>;
    save(match: Match): Promise<void>;
}
