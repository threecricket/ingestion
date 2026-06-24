import { Ball, BallResult } from "@/contexts/match/domain/models/ball";
import { Inning } from "@/contexts/match/domain/models/innings";
import { Match, MatchFormat, MatchResult, ResultType } from "@/contexts/match/domain/models/match";

export interface TestDeliveryInput {
    batterId: string;
    bowlerId: string;
    runs?: number;
    extras?: number;
    wide?: boolean;
    noBall?: boolean;
    teamRuns?: number;
    teamWickets?: number;
    ballNumber?: number;
}

export interface TestInningInput {
    inningNumber: number;
    battingTeamId: string;
    bowlingTeamId: string;
    target?: number | null;
    deliveries: TestDeliveryInput[];
}

export interface TestMatchInput {
    format?: MatchFormat;
    innings: TestInningInput[];
}

const DEFAULT_NON_STRIKER = "non-striker-id";

export function buildTestMatch(input: TestMatchInput): Match {
    let deliverySequence = 0;
    const innings = input.innings.map((inningInput) => {
        const ballList: Ball[] = [];
        let ballNumber = 0;

        for (const delivery of inningInput.deliveries) {
            deliverySequence += 1;
            const isLegal = !delivery.wide && !delivery.noBall;
            if (isLegal) {
                ballNumber += 1;
            }

            ballList.push(
                Ball.create(
                    deliverySequence,
                    isLegal ? (delivery.ballNumber ?? ballNumber) : ballNumber,
                    delivery.teamRuns ?? 0,
                    delivery.teamWickets ?? 0,
                    delivery.batterId,
                    0,
                    0,
                    delivery.bowlerId,
                    0,
                    0,
                    0,
                    DEFAULT_NON_STRIKER,
                    0,
                    0,
                    BallResult.create(
                        delivery.runs ?? 0,
                        false,
                        delivery.extras ?? 0,
                        delivery.wide ?? false,
                        delivery.noBall ?? false,
                        null,
                        null,
                    ),
                ),
            );
        }

        return Inning.create(
            inningInput.inningNumber,
            0,
            0,
            0,
            ballList.length,
            inningInput.battingTeamId,
            inningInput.bowlingTeamId,
            ballList,
            inningInput.target ?? null,
        );
    });

    return Match.create(
        "match-id",
        "venue-id",
        "team-1-id",
        "team-2-id",
        new Date("2024-01-01"),
        new Date("2024-01-01"),
        MatchResult.create(ResultType.WON, "team-1-id"),
        input.format ?? MatchFormat.T20,
        innings,
    );
}
