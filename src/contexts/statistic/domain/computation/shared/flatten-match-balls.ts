import { Ball } from "@/contexts/match/domain/models/ball";
import { Inning } from "@/contexts/match/domain/models/innings";
import { Match } from "@/contexts/match/domain/models/match";

export interface FlattenedBall {
    index: number;
    ball: Ball;
    inning: Inning;
}

export function flattenMatchBalls(match: Match): FlattenedBall[] {
    const flattened: FlattenedBall[] = [];
    let index = 0;

    for (const inning of match.getInnings()) {
        for (const ball of inning.getBallList()) {
            flattened.push({ index, ball, inning });
            index += 1;
        }
    }

    return flattened;
}
