import { Match } from "@/contexts/match/domain/models/match";

export interface WinProbabilityPredictor {
    predictForMatch(match: Match): Promise<number[]>;
}
