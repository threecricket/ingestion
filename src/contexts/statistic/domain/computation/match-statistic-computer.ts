import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../models/match-statistic";

export interface MatchStatisticComputeContext {
    winProbabilityByBallIndex?: number[];
}

export interface MatchStatisticComputer {
    getType(): MatchStatisticType;
    compute(match: Match, context?: MatchStatisticComputeContext): MatchStatistic[] | Promise<MatchStatistic[]>;
}

export abstract class BaseMatchStatisticComputer implements MatchStatisticComputer {
    public abstract getType(): MatchStatisticType;
    public abstract compute(match: Match, context?: MatchStatisticComputeContext): MatchStatistic[] | Promise<MatchStatistic[]>;

    protected createStatistic(match: Match, entityId: string, value: number): MatchStatistic {
        const type = this.getType();
        return MatchStatistic.create(
            match.getMatchId(),
            type.getName(),
            type.getTargetEntityType(),
            entityId,
            value,
        );
    }
}
