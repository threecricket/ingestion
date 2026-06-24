import { MatchStatisticType } from "../models/match-statistic";

export interface MatchStatisticTypeRepository {
    findByName(name: string): Promise<MatchStatisticType | null>;
    save(matchStatisticType: MatchStatisticType): Promise<void>;
}
