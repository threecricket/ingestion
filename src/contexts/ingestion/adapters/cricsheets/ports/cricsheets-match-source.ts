export interface CricsheetsMatchSource {
    listMatchKeys(): Promise<string[]>;
    getMatch(key: string): Promise<unknown>;
}
