import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { RatingNormsArtifact, RatingNormsWriter } from "@/contexts/statistic/domain/ports/rating-norms-writer";

export interface S3Location {
    bucket: string;
    prefix: string;
}

export function parseS3Uri(uri: string): S3Location {
    const match = /^s3:\/\/([^/]+)\/?(.*)$/.exec(uri.trim());
    if (!match) {
        throw new Error(`Invalid S3 URI: ${uri}`);
    }
    return { bucket: match[1], prefix: match[2].replace(/\/+$/, "") };
}

export class S3RatingNormsWriter implements RatingNormsWriter {
    private readonly latestKey: string;
    private readonly metadataKey: string;

    public constructor(
        private readonly client: S3Client,
        private readonly location: S3Location,
    ) {
        const base = location.prefix ? `${location.prefix}/rating-norms` : "rating-norms";
        this.latestKey = `${base}/latest.json`;
        this.metadataKey = `${base}/latest.metadata.json`;
    }

    public async write(artifact: RatingNormsArtifact): Promise<string> {
        await this.put(this.latestKey, artifact);
        await this.put(this.metadataKey, { updatedAt: artifact.updatedAt });
        return artifact.updatedAt;
    }

    private async put(key: string, body: unknown): Promise<void> {
        await this.client.send(new PutObjectCommand({
            Bucket: this.location.bucket,
            Key: key,
            Body: JSON.stringify(body),
            ContentType: "application/json",
        }));
    }
}
