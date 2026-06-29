export interface PlayerNorm {
    format: string;
    statisticName: string;
    mean: number;
    stdDev: number;
    sampleSize: number;
}

export interface PlayerStatisticRecord {
    playerId: string;
    matchId: string;
    format: string;
    statisticName: string;
    value: number;
}

export interface PlayerStatisticsQueryRepository {
    aggregatePlayerNorms(windowStart: Date): Promise<PlayerNorm[]>;
    findPlayerStatistics(playerIds: string[]): Promise<PlayerStatisticRecord[]>;
    findAllPlayerIds(): Promise<string[]>;
}
