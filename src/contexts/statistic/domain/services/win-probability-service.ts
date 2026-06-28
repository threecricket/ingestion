import { Match, MatchFormat } from "@/contexts/match/domain/models/match";
import { FlattenedBall, flattenMatchBalls } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { isWinProbabilitySupportedFormat } from "@/contexts/statistic/domain/computation/shared/supported-formats";
import { ModelGateway, ModelTrainScope } from "@/contexts/statistic/domain/ports/model-gateway";
import { WinProbabilityPredictor } from "@/contexts/statistic/domain/ports/win-probability-predictor";
import { buildWinProbabilityFeatures } from "./win-probability-features";

export const WIN_PROBABILITY_MODEL_NAME = "batting_team_win_probability";

const WIN_PROBABILITY_TRAIN_FORMATS: MatchFormat[] = [MatchFormat.T20, MatchFormat.ODI];
const WIN_PROBABILITY_INNINGS: number[] = [1, 2];

export const WIN_PROBABILITY_TRAIN_WINDOW_YEARS = 2;

/**
 * Inclusive lower bound (UTC, `YYYY-MM-DD`) for the matches a model is trained on.
 * The same value is sent at predict time so the trained artifact resolves, because the
 * model-api keys artifacts by their full filter set (format, innings, start_date).
 */
export function winProbabilityTrainingWindowStart(
    reference: Date = new Date(),
    years: number = WIN_PROBABILITY_TRAIN_WINDOW_YEARS,
): string {
    const start = new Date(Date.UTC(
        reference.getUTCFullYear() - years,
        reference.getUTCMonth(),
        reference.getUTCDate(),
    ));
    return start.toISOString().slice(0, 10);
}

export function buildWinProbabilityTrainScopes(): ModelTrainScope[] {
    return WIN_PROBABILITY_TRAIN_FORMATS.flatMap((format) =>
        WIN_PROBABILITY_INNINGS.map((inning) => ({
            filters: { format: [format], innings: [String(inning)] },
            hyperparams: { C: 1.0, class_weight: "balanced" },
            testSize: 0.2,
        })),
    );
}

export class WinProbabilityService implements WinProbabilityPredictor {
    private readonly trainScopes: ModelTrainScope[];
    private preparePromise: Promise<void> | null = null;
    private cachedMatchId: string | null = null;
    private cachedPredictions: number[] | null = null;

    public constructor(
        private readonly gateway: ModelGateway,
        private readonly modelName: string = WIN_PROBABILITY_MODEL_NAME,
        trainScopes: ModelTrainScope[] = buildWinProbabilityTrainScopes(),
        private readonly trainingWindowStart: string = winProbabilityTrainingWindowStart(),
    ) {
        this.trainScopes = trainScopes;
    }

    public async prepare(): Promise<void> {
        if (!this.preparePromise) {
            this.preparePromise = this.train();
        }
        return this.preparePromise;
    }

    private async train(): Promise<void> {
        for (const scope of this.trainScopes) {
            const scopedFilters = this.withTrainingWindow(scope.filters);
            const scopeLabel = JSON.stringify(scopedFilters);
            const result = await this.gateway.train(this.modelName, { ...scope, filters: scopedFilters });

            if (result.trained) {
                console.log(`  ${this.modelName} ${scopeLabel}: trained on ${result.rowsUsed} row(s)`);
            } else {
                console.warn(`  ${this.modelName} ${scopeLabel}: skipped (${result.message ?? "not trained"})`);
            }
        }
    }

    public async predictForMatch(match: Match): Promise<number[]> {
        if (!isWinProbabilitySupportedFormat(match.getMatchFormat())) {
            return [];
        }

        const matchId = match.getMatchId();
        if (this.cachedMatchId === matchId && this.cachedPredictions) {
            return this.cachedPredictions;
        }

        const flattenedBalls = flattenMatchBalls(match);
        if (flattenedBalls.length === 0) {
            return [];
        }

        const predictions = await this.predictByInnings(match, flattenedBalls);

        this.cachedMatchId = matchId;
        this.cachedPredictions = predictions;
        return predictions;
    }

    private async predictByInnings(match: Match, flattenedBalls: FlattenedBall[]): Promise<number[]> {
        const format = match.getMatchFormat();
        const predictions = new Array<number>(flattenedBalls.length);
        const ballsByInning = new Map<number, FlattenedBall[]>();

        for (const flattenedBall of flattenedBalls) {
            const inningNumber = flattenedBall.inning.getInningNumber();
            const group = ballsByInning.get(inningNumber);
            if (group) {
                group.push(flattenedBall);
            } else {
                ballsByInning.set(inningNumber, [flattenedBall]);
            }
        }

        for (const [inningNumber, group] of ballsByInning) {
            const features = buildWinProbabilityFeatures(match, group);
            const groupPredictions = await this.gateway.predict(
                this.modelName,
                this.withTrainingWindow({ format: [format], innings: [String(inningNumber)] }),
                features,
            );

            if (groupPredictions.length !== group.length) {
                throw new Error(
                    `model-api returned ${groupPredictions.length} predictions for ${group.length} deliveries in innings ${inningNumber}`,
                );
            }

            group.forEach((flattenedBall, position) => {
                predictions[flattenedBall.index] = groupPredictions[position];
            });
        }

        return predictions;
    }

    private withTrainingWindow(filters: Record<string, string[]>): Record<string, string[]> {
        return { ...filters, start_date: [this.trainingWindowStart] };
    }
}
