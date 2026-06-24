import { Match } from "@/contexts/match/domain/models/match";
import { flattenMatchBalls } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { isWinProbabilitySupportedFormat } from "@/contexts/statistic/domain/computation/shared/supported-formats";
import { WinProbabilityPredictor } from "@/contexts/statistic/domain/ports/win-probability-predictor";
import { ModelApiClient } from "./model-api-client";
import {
    buildWinProbabilityFeatures,
    WIN_PROBABILITY_MODEL_NAME,
} from "./win-probability-feature-mapper";

export class ModelApiWinProbabilityPredictor implements WinProbabilityPredictor {
    public constructor(private readonly modelApiClient: ModelApiClient) {}

    public async predictForMatch(match: Match): Promise<number[]> {
        if (!isWinProbabilitySupportedFormat(match.getMatchFormat())) {
            return [];
        }

        const flattenedBalls = flattenMatchBalls(match);
        if (flattenedBalls.length === 0) {
            return [];
        }

        const features = buildWinProbabilityFeatures(match, flattenedBalls);
        const response = await this.modelApiClient.predict({
            model: WIN_PROBABILITY_MODEL_NAME,
            filters: { format: [match.getMatchFormat()] },
            input: features,
        });

        if (response.predictions.length !== flattenedBalls.length) {
            throw new Error(
                `model-api returned ${response.predictions.length} predictions for ${flattenedBalls.length} deliveries`,
            );
        }

        return response.predictions;
    }
}
