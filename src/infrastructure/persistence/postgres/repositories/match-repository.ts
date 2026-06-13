import { asc, eq } from "drizzle-orm";
import { Ball, BallResult, WicketType } from "@/domain/match/models/ball";
import { Inning } from "@/domain/match/models/innings";
import { Match, MatchFormat, MatchResult, ResultType } from "@/domain/match/models/match";
import { MatchRepository } from "@/domain/match/repositories/match-repository";
import { Database } from "@/infrastructure/persistence/postgres/client";
import { balls, innings, matches } from "@/infrastructure/persistence/postgres/schema";

type MatchRow = typeof matches.$inferSelect;
type InningRow = typeof innings.$inferSelect;
type BallRow = typeof balls.$inferSelect;

export class PostgresMatchRepository implements MatchRepository {
    public constructor(private readonly db: Database) {}

    public async findById(matchId: string): Promise<Match | null> {
        const matchRows = await this.db
            .select()
            .from(matches)
            .where(eq(matches.id, matchId))
            .limit(1);

        const matchRow = matchRows[0];
        if (!matchRow) {
            return null;
        }

        const inningRows = await this.db
            .select()
            .from(innings)
            .where(eq(innings.matchId, matchId))
            .orderBy(asc(innings.inningNumber));

        const ballRows = await this.db
            .select()
            .from(balls)
            .where(eq(balls.matchId, matchId))
            .orderBy(asc(balls.inningNumber), asc(balls.ballNumber));

        return this.toMatch(matchRow, inningRows, ballRows);
    }

    public async save(match: Match): Promise<void> {
        const matchId = match.getMatchId();
        const result = match.getMatchResult();
        const matchRow = {
            id: matchId,
            venueId: match.getMatchVenueId(),
            team1Id: match.getMatchTeam1Id(),
            team2Id: match.getMatchTeam2Id(),
            startDate: match.getMatchStartDate(),
            endDate: match.getMatchEndDate(),
            resultType: result.getResultType(),
            subjectTeamId: result.getSubjectTeamId(),
            format: match.getMatchFormat(),
        };

        await this.db.transaction(async (tx) => {
            await tx
                .insert(matches)
                .values(matchRow)
                .onConflictDoUpdate({
                    target: matches.id,
                    set: {
                        venueId: matchRow.venueId,
                        team1Id: matchRow.team1Id,
                        team2Id: matchRow.team2Id,
                        startDate: matchRow.startDate,
                        endDate: matchRow.endDate,
                        resultType: matchRow.resultType,
                        subjectTeamId: matchRow.subjectTeamId,
                        format: matchRow.format,
                    },
                });

            await tx.delete(balls).where(eq(balls.matchId, matchId));
            await tx.delete(innings).where(eq(innings.matchId, matchId));

            const inningRows = match.getInnings().map((inning) => ({
                matchId,
                inningNumber: inning.getInningNumber(),
                runs: inning.getInningRuns(),
                wickets: inning.getInningWickets(),
                overs: inning.getInningOvers(),
                balls: inning.getInningBalls(),
                target: inning.getTarget(),
                battingTeamId: inning.getBattingTeamId(),
                bowlingTeamId: inning.getBowlingTeamId(),
            }));

            if (inningRows.length > 0) {
                await tx.insert(innings).values(inningRows);
            }

            const ballRows = match.getInnings().flatMap((inning) =>
                inning.getBallList().map((ball) => this.fromBall(matchId, inning.getInningNumber(), ball)),
            );

            if (ballRows.length > 0) {
                await tx.insert(balls).values(ballRows);
            }
        });
    }

    private toMatch(matchRow: MatchRow, inningRows: InningRow[], ballRows: BallRow[]): Match {
        const ballsByInning = new Map<number, BallRow[]>();
        for (const ballRow of ballRows) {
            const existing = ballsByInning.get(ballRow.inningNumber) ?? [];
            existing.push(ballRow);
            ballsByInning.set(ballRow.inningNumber, existing);
        }

        const matchInnings = inningRows.map((inningRow) => {
            const inningBalls = (ballsByInning.get(inningRow.inningNumber) ?? [])
                .map((ballRow) => this.toBall(ballRow));

            return Inning.create(
                inningRow.inningNumber,
                inningRow.runs,
                inningRow.wickets,
                inningRow.overs,
                inningRow.balls,
                inningRow.battingTeamId,
                inningRow.bowlingTeamId,
                inningBalls,
                inningRow.target,
            );
        });

        return Match.create(
            matchRow.id,
            matchRow.venueId,
            matchRow.team1Id,
            matchRow.team2Id,
            matchRow.startDate,
            matchRow.endDate,
            MatchResult.create(
                matchRow.resultType as ResultType,
                matchRow.subjectTeamId,
            ),
            matchRow.format as MatchFormat,
            matchInnings,
        );
    }

    private toBall(row: BallRow): Ball {
        const ballResult = BallResult.create(
            row.resultRuns,
            row.resultOut === 1,
            row.resultExtras,
            row.resultWide === 1,
            row.resultNoBall === 1,
            row.playerOutId,
            row.wicketType as WicketType | null,
        );

        return Ball.create(
            row.ballNumber,
            row.runs,
            row.wickets,
            row.batterId,
            row.batterRuns,
            row.batterBalls,
            row.bowlerId,
            row.bowlerRuns,
            row.bowlerBalls,
            row.bowlerWickets,
            row.nonStrikerId,
            row.nonStrikerRuns,
            row.nonStrikerBalls,
            ballResult,
        );
    }

    private fromBall(matchId: string, inningNumber: number, ball: Ball) {
        const result = ball.getBallResult();
        return {
            matchId,
            inningNumber,
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
            resultRuns: result.getRuns(),
            resultOut: result.getOut() ? 1 : 0,
            resultExtras: result.getExtras(),
            resultWide: result.getWide() ? 1 : 0,
            resultNoBall: result.getNoBall() ? 1 : 0,
            playerOutId: result.getPlayerOutId(),
            wicketType: result.getWicketType(),
        };
    }
}
