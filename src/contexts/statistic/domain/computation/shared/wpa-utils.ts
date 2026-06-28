import { Match, ResultType } from "@/contexts/match/domain/models/match";
import { FlattenedBall } from "./flatten-match-balls";

export interface BallImpacts {
    battingImpact: number[];
    bowlingImpact: number[];
}

export function computeBallImpacts(
    winProbabilities: number[],
    flattenedBalls: FlattenedBall[],
    match: Match,
): BallImpacts {
    const battingImpact: number[] = [];
    const bowlingImpact: number[] = [];

    for (let index = 0; index < winProbabilities.length; index += 1) {
        const postBall = resolvePostBallWinProbability(winProbabilities, flattenedBalls, match, index);
        const delta = postBall - winProbabilities[index];
        battingImpact.push(delta);
        bowlingImpact.push(-delta);
    }

    return { battingImpact, bowlingImpact };
}

function resolvePostBallWinProbability(
    winProbabilities: number[],
    flattenedBalls: FlattenedBall[],
    match: Match,
    index: number,
): number {
    const isLastBall = index === winProbabilities.length - 1;

    if (!isLastBall) {
        const currentInning = flattenedBalls[index].inning.getInningNumber();
        const nextInning = flattenedBalls[index + 1].inning.getInningNumber();

        if (currentInning === nextInning) {
            return winProbabilities[index + 1];
        }

        // Innings boundary: the batting team's win probability entering the break is the
        // complement of the chasing team's win probability at the start of their innings.
        // The raw next value belongs to the other team, so it must be flipped, not leaked.
        return 1 - winProbabilities[index + 1];
    }

    // Final delivery of the match: jump to the realised outcome for this innings' batting team.
    return terminalWinProbability(match, flattenedBalls[index].inning.getBattingTeamId());
}

function terminalWinProbability(match: Match, battingTeamId: string): number {
    const result = match.getMatchResult();

    if (result.getResultType() === ResultType.WON) {
        return result.getSubjectTeamId() === battingTeamId ? 1 : 0;
    }

    return 0.5;
}
