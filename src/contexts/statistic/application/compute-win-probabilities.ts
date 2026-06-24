import { Match } from "@/contexts/match/domain/models/match";
import { isWinProbabilitySupportedFormat } from "@/contexts/statistic/domain/computation/shared/supported-formats";
import { WinProbabilityPredictor } from "@/contexts/statistic/domain/ports/win-probability-predictor";

export class ComputeWinProbabilities {
    public constructor(private readonly winProbabilityPredictor: WinProbabilityPredictor) {}

    public async computeForMatch(match: Match): Promise<number[]> {
        if (!isWinProbabilitySupportedFormat(match.getMatchFormat())) {
            return [];
        }

        return this.winProbabilityPredictor.predictForMatch(match);
    }
}
