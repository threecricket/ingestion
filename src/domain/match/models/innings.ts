import { Ball } from "@/domain/match/models/ball";

export class Inning {
    private inningNumber: number;
    private inningRuns: number;
    private inningWickets: number;
    private inningOvers: number;
    private inningBalls: number;
    private target: number | null = null;
    private battingTeamId: string;
    private bowlingTeamId: string;
    private ballList: Ball[];

    private constructor(
        inningNumber: number,
        inningRuns: number,
        inningWickets: number,
        inningOvers: number,
        inningBalls: number,
        battingTeamId: string,
        bowlingTeamId: string,
        ballList: Ball[],
        target: number | null = null,
    ) {
        this.inningNumber = inningNumber;
        this.inningRuns = inningRuns;
        this.inningWickets = inningWickets;
        this.inningOvers = inningOvers;
        this.inningBalls = inningBalls;
        this.battingTeamId = battingTeamId;
        this.bowlingTeamId = bowlingTeamId;
        this.ballList = ballList;
        this.target = target;
    }

    public static create(
        inningNumber: number,
        inningRuns: number,
        inningWickets: number,
        inningOvers: number,
        inningBalls: number,
        battingTeamId: string,
        bowlingTeamId: string,
        ballList: Ball[],
        target: number | null = null,
    ): Inning {
        if (!inningNumber || !inningRuns || !inningWickets || !inningOvers || !inningBalls || !battingTeamId || !bowlingTeamId || !ballList) {
            throw new Error("Invalid inning data");
        }
        return new Inning(
            inningNumber,
            inningRuns,
            inningWickets,
            inningOvers,
            inningBalls,
            battingTeamId,
            bowlingTeamId,
            ballList,
            target,
        );
    }

    public getInningNumber(): number {
        return this.inningNumber;
    }

    public getInningRuns(): number {
        return this.inningRuns;
    }

    public getInningWickets(): number {
        return this.inningWickets;
    }

    public getInningOvers(): number {
        return this.inningOvers;
    }

    public getInningBalls(): number {
        return this.inningBalls;
    }

    public getTarget(): number | null {
        return this.target;
    }

    public getBattingTeamId(): string {
        return this.battingTeamId;
    }

    public getBowlingTeamId(): string {
        return this.bowlingTeamId;
    }

    public getBallList(): Ball[] {
        return this.ballList;
    }
}
