import { Match } from "@/contexts/match/domain/models/match";

export interface WinProbabilityPredictor {
    prepare(): Promise<void>;
    predictForMatch(match: Match): Promise<number[]>;
}
