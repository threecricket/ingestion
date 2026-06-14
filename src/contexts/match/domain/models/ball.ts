export enum WicketType {
    BOWLED = "bowled",
    CAUGHT = "caught",
    LBW = "lbw",
    STUMPED = "stump",
    RUN_OUT = "run_out",
    HIT_WICKET = "hit_wicket",
    OBSTRUCTING = "obstructing",
    OTHER = "other",
}

export class BallResult {
    private runs: number;
    private out: boolean;
    private extras: number;
    private wide: boolean;
    private noBall: boolean;
    private playerOutId: string | null;
    private wicketType: WicketType | null;

    private constructor(runs: number, out: boolean, extras: number, wide: boolean, noBall: boolean, playerOutId: string | null, wicketType: WicketType | null) {
        this.runs = runs;
        this.out = out;
        this.extras = extras;
        this.wide = wide;
        this.noBall = noBall;
        this.playerOutId = playerOutId;
        this.wicketType = wicketType;
    }

    public static create(runs: number, out: boolean, extras: number, wide: boolean, noBall: boolean, playerOutId: string | null, wicketType: WicketType | null): BallResult {
        if (
            runs === undefined
            || out === undefined
            || extras === undefined
            || wide === undefined
            || noBall === undefined
            || (out && (!playerOutId || !wicketType))
        ) {
            throw new Error("Invalid ball result data");
        }
        return new BallResult(runs, out, extras, wide, noBall, playerOutId, wicketType);
    }

    public getRuns(): number {
        return this.runs;
    }

    public getOut(): boolean {
        return this.out;
    }

    public getExtras(): number {
        return this.extras;
    }

    public getWide(): boolean {
        return this.wide;
    }

    public getNoBall(): boolean {
        return this.noBall;
    }

    public getPlayerOutId(): string | null {
        return this.playerOutId;
    }

    public getWicketType(): WicketType | null {
        return this.wicketType;
    }
}

export class Ball {
    private ballNumber: number;
    private runs: number;
    private wickets: number;

    private batterId: string;
    private batterRuns: number;
    private batterBalls: number;

    private bowlerId: string;
    private bowlerRuns: number;
    private bowlerBalls: number;
    private bowlerWickets: number;

    private nonStrikerId: string;
    private nonStrikerRuns: number;
    private nonStrikerBalls: number;

    private ballResult: BallResult;

    private constructor(ballNumber: number, runs: number, wickets: number, batterId: string, batterRuns: number, batterBalls: number, bowlerId: string, bowlerRuns: number, bowlerBalls: number, bowlerWickets: number, nonStrikerId: string, nonStrikerRuns: number, nonStrikerBalls: number, ballResult: BallResult) {
        this.ballNumber = ballNumber;
        this.runs = runs;
        this.wickets = wickets;
        this.batterId = batterId;
        this.batterRuns = batterRuns;
        this.batterBalls = batterBalls;
        this.bowlerId = bowlerId;
        this.bowlerRuns = bowlerRuns;
        this.bowlerBalls = bowlerBalls;
        this.bowlerWickets = bowlerWickets;
        this.nonStrikerId = nonStrikerId;
        this.nonStrikerRuns = nonStrikerRuns;
        this.nonStrikerBalls = nonStrikerBalls;
        this.ballResult = ballResult;
    }

    public static create(ballNumber: number, runs: number, wickets: number, batterId: string, batterRuns: number, batterBalls: number, bowlerId: string, bowlerRuns: number, bowlerBalls: number, bowlerWickets: number, nonStrikerId: string, nonStrikerRuns: number, nonStrikerBalls: number, ballResult: BallResult): Ball {
        if (
            !ballNumber
            || runs === undefined
            || wickets === undefined
            || !batterId
            || batterRuns === undefined
            || batterBalls === undefined
            || !bowlerId
            || bowlerRuns === undefined
            || bowlerBalls === undefined
            || bowlerWickets === undefined
            || !nonStrikerId
            || nonStrikerRuns === undefined
            || nonStrikerBalls === undefined
            || !ballResult
        ) {
            throw new Error("Invalid ball data");
        }

        return new Ball(ballNumber, runs, wickets, batterId, batterRuns, batterBalls, bowlerId, bowlerRuns, bowlerBalls, bowlerWickets, nonStrikerId, nonStrikerRuns, nonStrikerBalls, ballResult);
    }

    public getBallNumber(): number {
        return this.ballNumber;
    }

    public getRuns(): number {
        return this.runs;
    }

    public getWickets(): number {
        return this.wickets;
    }

    public getBatterId(): string {
        return this.batterId;
    }

    public getBatterRuns(): number {
        return this.batterRuns;
    }

    public getBatterBalls(): number {
        return this.batterBalls;
    }

    public getBowlerId(): string {
        return this.bowlerId;
    }

    public getBowlerRuns(): number {
        return this.bowlerRuns;
    }

    public getBowlerBalls(): number {
        return this.bowlerBalls;
    }

    public getBowlerWickets(): number {
        return this.bowlerWickets;
    }

    public getNonStrikerId(): string {
        return this.nonStrikerId;
    }

    public getNonStrikerRuns(): number {
        return this.nonStrikerRuns;
    }

    public getNonStrikerBalls(): number {
        return this.nonStrikerBalls;
    }

    public getBallResult(): BallResult {
        return this.ballResult;
    }
}
