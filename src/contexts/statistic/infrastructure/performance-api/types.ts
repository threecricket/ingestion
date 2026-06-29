export interface PerformanceBallResult {
    runs: number;
    out: boolean;
    extras: number;
    wide: boolean;
    noBall: boolean;
    playerOutId: string | null;
    wicketType: string | null;
}

export interface PerformanceBall {
    deliverySequence: number;
    ballNumber: number;
    runs: number;
    wickets: number;
    batterId: string;
    batterRuns: number;
    batterBalls: number;
    bowlerId: string;
    bowlerRuns: number;
    bowlerBalls: number;
    bowlerWickets: number;
    nonStrikerId: string;
    nonStrikerRuns: number;
    nonStrikerBalls: number;
    result: PerformanceBallResult;
}

export interface PerformanceInning {
    inningNumber: number;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    battingTeamId: string;
    bowlingTeamId: string;
    target: number | null;
    ballList: PerformanceBall[];
}

export interface PerformanceMatchResult {
    type: string;
    subjectTeamId: string | null;
}

export interface PerformanceMatch {
    matchId: string;
    format: string;
    team1Id: string;
    team2Id: string;
    venueId: string | null;
    startDate: string;
    endDate: string | null;
    result: PerformanceMatchResult;
    innings: PerformanceInning[];
}

export interface PerformancePlayerEnrichment {
    battingHand: string | null;
    bowlingHand: string | null;
    bowlingStyle: string | null;
}

export interface ComputeMatchStatisticsRequest {
    match: PerformanceMatch;
    players: Record<string, PerformancePlayerEnrichment>;
}

export interface PerformanceStatistic {
    matchId: string;
    statisticTypeName: string;
    entityType: string;
    entityId: string;
    value: number;
}

export interface ComputeMatchStatisticsResponse {
    statistics: PerformanceStatistic[];
}

export interface PerformancePlayerMatchStatistic {
    matchId: string;
    format: string;
    statisticName: string;
    value: number;
}

export interface ComputePlayerRatingsRequest {
    playerId: string;
    statistics: PerformancePlayerMatchStatistic[];
}

export interface PerformanceSubRating {
    name: string;
    displayName: string;
    value: number;
}

export interface ComputePlayerRatingsResponse {
    playerId: string;
    overallRating: number;
    subRatings: PerformanceSubRating[];
    normsVersion: string | null;
}

export interface CatalogueMatchStatistic {
    name: string;
    displayName: string;
    description: string;
    targetEntityType: string;
}

export interface CataloguePlayerRating {
    name: string;
    displayName: string;
    description: string;
    kind: string;
}

export interface CatalogueResponse {
    matchStatistics: CatalogueMatchStatistic[];
    playerRatings: CataloguePlayerRating[];
    ratingNormsVersion: string | null;
}
