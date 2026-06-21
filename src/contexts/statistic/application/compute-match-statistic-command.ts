import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatisticType } from "../domain/models/match-statistic";

export class ComputeMatchStatisticCommand {
    public constructor(
        public readonly match: Match,
        public readonly statisticType: MatchStatisticType,
    ) {}
}
