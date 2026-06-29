import { Ball } from "@/contexts/match/domain/models/ball";
import { Inning } from "@/contexts/match/domain/models/innings";
import { Match } from "@/contexts/match/domain/models/match";
import { PlayerEnrichmentInput } from "@/contexts/statistic/domain/ports/performance-gateway";
import {
    ComputeMatchStatisticsRequest,
    PerformanceBall,
    PerformanceInning,
    PerformanceMatch,
} from "./types";

function toPerformanceBall(ball: Ball): PerformanceBall {
    const result = ball.getBallResult();
    return {
        deliverySequence: ball.getDeliverySequence(),
        ballNumber: ball.getBallNumber(),
        runs: ball.getRuns(),
        wickets: ball.getWickets(),
        batterId: ball.getBatterId(),
        batterRuns: ball.getBatterRuns(),
        batterBalls: ball.getBatterBalls(),
        bowlerId: ball.getBowlerId(),
        bowlerRuns: ball.getBowlerRuns(),
        bowlerBalls: ball.getBowlerBalls(),
        bowlerWickets: ball.getBowlerWickets(),
        nonStrikerId: ball.getNonStrikerId(),
        nonStrikerRuns: ball.getNonStrikerRuns(),
        nonStrikerBalls: ball.getNonStrikerBalls(),
        result: {
            runs: result.getRuns(),
            out: result.getOut(),
            extras: result.getExtras(),
            wide: result.getWide(),
            noBall: result.getNoBall(),
            playerOutId: result.getPlayerOutId(),
            wicketType: result.getWicketType(),
        },
    };
}

function toPerformanceInning(inning: Inning): PerformanceInning {
    return {
        inningNumber: inning.getInningNumber(),
        runs: inning.getInningRuns(),
        wickets: inning.getInningWickets(),
        overs: inning.getInningOvers(),
        balls: inning.getInningBalls(),
        battingTeamId: inning.getBattingTeamId(),
        bowlingTeamId: inning.getBowlingTeamId(),
        target: inning.getTarget(),
        ballList: inning.getBallList().map(toPerformanceBall),
    };
}

function toPerformanceMatch(match: Match): PerformanceMatch {
    const result = match.getMatchResult();
    return {
        matchId: match.getMatchId(),
        format: match.getMatchFormat(),
        team1Id: match.getMatchTeam1Id(),
        team2Id: match.getMatchTeam2Id(),
        venueId: match.getMatchVenueId(),
        startDate: match.getMatchStartDate().toISOString(),
        endDate: match.getMatchEndDate().toISOString(),
        result: {
            type: result.getResultType(),
            subjectTeamId: result.getSubjectTeamId(),
        },
        innings: match.getInnings().map(toPerformanceInning),
    };
}

export function toComputeMatchStatisticsRequest(
    match: Match,
    players: Record<string, PlayerEnrichmentInput>,
): ComputeMatchStatisticsRequest {
    return {
        match: toPerformanceMatch(match),
        players,
    };
}
