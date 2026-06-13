import { Inning } from "@/domain/match/models/innings";

export enum ResultType {
    WON = "won",
    LOST = "lost",
    TIE = "tie",
    NO_RESULT = "no_result",
}

export class MatchResult {
    private resultType: ResultType;
    private subjectTeamId: string | null = null;

    private constructor(resultType: ResultType, subjectTeamId: string | null = null) {
        this.resultType = resultType;
        this.subjectTeamId = subjectTeamId;
    }

    public static create(resultType: ResultType, subjectTeamId: string | null = null): MatchResult {
        if (!resultType) {
            throw new Error("Invalid match result data");
        }
        return new MatchResult(resultType, subjectTeamId);
    }
    
    public getResultType(): ResultType {
        return this.resultType;
    }

    public getSubjectTeamId(): string | null {
        return this.subjectTeamId;
    }
}

export enum MatchFormat {
    TEST = "test",
    ODI = "odi",
    T20 = "t20",
}

export class Match {
    private matchId: string;
    private matchVenueId: string;
    private matchTeam1Id: string;
    private matchTeam2Id: string;
    private matchStartDate: Date;
    private matchEndDate: Date;
    private matchResult: MatchResult;
    private matchFormat: MatchFormat;
    private innings: Inning[];

    private constructor(matchId: string, matchVenueId: string, matchTeam1Id: string, matchTeam2Id: string, matchStartDate: Date, matchEndDate: Date, matchResult: MatchResult, matchFormat: MatchFormat, innings: Inning[]) {
        this.matchId = matchId;
        this.matchVenueId = matchVenueId;
        this.matchTeam1Id = matchTeam1Id;
        this.matchTeam2Id = matchTeam2Id;
        this.matchStartDate = matchStartDate;
        this.matchEndDate = matchEndDate;
        this.matchResult = matchResult;
        this.matchFormat = matchFormat;
        this.innings = innings;
    }

    public static create(matchId: string, matchVenueId: string, matchTeam1Id: string, matchTeam2Id: string, matchStartDate: Date, matchEndDate: Date, matchResult: MatchResult, matchFormat: MatchFormat, innings: Inning[]): Match {
        if (!matchId || !matchVenueId || !matchTeam1Id || !matchTeam2Id || !matchStartDate || !matchEndDate || !matchResult || !matchFormat) {
            throw new Error("Invalid match data");
        }
        return new Match(matchId, matchVenueId, matchTeam1Id, matchTeam2Id, matchStartDate, matchEndDate, matchResult, matchFormat, innings);
    }

    public getMatchId(): string {
        return this.matchId;
    }

    public getMatchVenueId(): string {
        return this.matchVenueId;
    }
    
    public getMatchTeam1Id(): string {
        return this.matchTeam1Id;
    }

    public getMatchTeam2Id(): string {
        return this.matchTeam2Id;
    }

    public getMatchStartDate(): Date {
        return this.matchStartDate;
    }

    public getMatchEndDate(): Date {
        return this.matchEndDate;
    }

    public getMatchResult(): MatchResult {
        return this.matchResult;
    }
    
    public getMatchFormat(): MatchFormat {
        return this.matchFormat;
    }

    public getInnings(): Inning[] {
        return this.innings;
    }
}