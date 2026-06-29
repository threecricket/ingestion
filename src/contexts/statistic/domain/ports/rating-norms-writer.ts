export interface RatingNormsDistributionEntry {
    mean: number;
    stdDev: number;
    sampleSize: number;
}

export interface RatingNormsArtifact {
    schemaVersion: number;
    updatedAt: string;
    formats: Record<string, Record<string, RatingNormsDistributionEntry>>;
}

export interface RatingNormsWriter {
    write(artifact: RatingNormsArtifact): Promise<string>;
}
