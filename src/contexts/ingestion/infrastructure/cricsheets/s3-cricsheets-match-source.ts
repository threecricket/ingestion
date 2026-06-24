import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { CricsheetsMatchSource } from "@/contexts/ingestion/adapters/cricsheets/ports/cricsheets-match-source";

const CRICSHEETS_PREFIX = "cricsheets/";

export class S3CricsheetsMatchSource implements CricsheetsMatchSource {
    public constructor(
        private readonly client: S3Client,
        private readonly bucketName: string,
    ) {}

    public async listMatchKeys(): Promise<string[]> {
        const objects = await this.client.send(new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: CRICSHEETS_PREFIX,
        }));

        return objects.Contents
            ?.map((object) => object.Key ?? "")
            .filter((key) => key.length > 0 && !key.endsWith("/"))
            ?? [];
    }

    public async getMatch(key: string): Promise<unknown> {
        const object = await this.client.send(new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key.startsWith(CRICSHEETS_PREFIX) ? key : `${CRICSHEETS_PREFIX}${key}`,
        }));

        if (!object.Body) {
            throw new Error(`No body found for match: ${key}`);
        }

        const body = await object.Body.transformToString();
        return JSON.parse(body);
    }
}
