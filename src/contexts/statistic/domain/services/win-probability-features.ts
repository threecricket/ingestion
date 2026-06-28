import { Match } from "@/contexts/match/domain/models/match";
import { FlattenedBall } from "@/contexts/statistic/domain/computation/shared/flatten-match-balls";
import { FORMAT_MAX_LEGAL_BALLS } from "@/contexts/statistic/domain/computation/shared/supported-formats";

export interface WinProbabilityFeatureInput extends Record<string, number[]> {
    current_innings_runs: number[];
    current_innings_wickets: number[];
    current_innings_legal_balls_remaining: number[];
    current_innings_runs_required: number[];
}

export function buildWinProbabilityFeatures(
    match: Match,
    flattenedBalls: FlattenedBall[],
): WinProbabilityFeatureInput {
    const format = match.getMatchFormat();
    const maxBalls = FORMAT_MAX_LEGAL_BALLS[format];

    const current_innings_runs: number[] = [];
    const current_innings_wickets: number[] = [];
    const current_innings_legal_balls_remaining: number[] = [];
    const current_innings_runs_required: number[] = [];

    for (const { ball, inning } of flattenedBalls) {
        const target = inning.getTarget();
        current_innings_runs.push(ball.getRuns());
        current_innings_wickets.push(ball.getWickets());
        current_innings_legal_balls_remaining.push(
            maxBalls === null ? 0 : Math.max(0, maxBalls - ball.getBallNumber() + 1),
        );

        current_innings_runs_required.push(
            target === null ? 0 : Math.max(0, target - ball.getRuns()),
        );
    }

    return {
        current_innings_runs,
        current_innings_wickets,
        current_innings_legal_balls_remaining,
        current_innings_runs_required,
    };
}
