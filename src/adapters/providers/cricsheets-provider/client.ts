import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

export class CricsheetsClient {
    private client: S3Client;

    public constructor(client: S3Client) {
        this.client = client;
    }

    public async getMatchObjects(): Promise<string[]> {
        const objects = await this.client.send(new ListObjectsV2Command({
            Bucket: process.env.CRICSHEETS_BUCKET_NAME,
            Prefix: "cricsheets/",
        }));

        return objects.Contents
            ?.map((object) => object.Key ?? "")
            .filter((key) => key.length > 0 && !key.endsWith("/"))
            ?? [];
    }

    public async getMatch(key: string): Promise<any> {
        const object = await this.client.send(new GetObjectCommand({
            Bucket: process.env.CRICSHEETS_BUCKET_NAME,
            Key: key.startsWith("cricsheets/") ? key : `cricsheets/${key}`,
        }));

        if (!object.Body) {
            throw new Error("No body found");
        }

        const body = await object.Body.transformToString();
        return JSON.parse(body);
    }
}