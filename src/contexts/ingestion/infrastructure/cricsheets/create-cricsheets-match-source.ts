import { join } from "path";
import { CricsheetsMatchSource } from "@/contexts/ingestion/adapters/cricsheets/ports/cricsheets-match-source";
import { createS3Client } from "@/contexts/ingestion/infrastructure/aws/s3-client";
import { LocalCricsheetsMatchSource } from "@/contexts/ingestion/infrastructure/cricsheets/local-cricsheets-match-source";
import { S3CricsheetsMatchSource } from "@/contexts/ingestion/infrastructure/cricsheets/s3-cricsheets-match-source";

export type CricsheetsSourceBackend = "s3" | "local";

export interface CricsheetsMatchSourceConfig {
    backend: CricsheetsSourceBackend;
    bucketName?: string;
    localPath?: string;
}

const backends: Record<CricsheetsSourceBackend, (config: CricsheetsMatchSourceConfig) => CricsheetsMatchSource> = {
    s3: (config) => new S3CricsheetsMatchSource(createS3Client(), config.bucketName!),
    local: (config) => new LocalCricsheetsMatchSource(config.localPath!),
};

export function parseCricsheetsMatchSourceConfig(
    env: NodeJS.ProcessEnv = process.env,
): CricsheetsMatchSourceConfig {
    const backend = (env.CRICSHEETS_SOURCE ?? "s3") as CricsheetsSourceBackend;

    if (backend !== "s3" && backend !== "local") {
        throw new Error(`Invalid CRICSHEETS_SOURCE: ${backend}. Expected "local" or "s3".`);
    }

    if (backend === "s3") {
        const bucketName = env.CRICSHEETS_BUCKET_NAME?.trim();
        if (!bucketName) {
            throw new Error("CRICSHEETS_BUCKET_NAME is required when CRICSHEETS_SOURCE=s3");
        }

        return { backend, bucketName };
    }

    const localPath = env.CRICSHEETS_LOCAL_PATH?.trim()
        ?? join(process.cwd(), "data", "cricsheets");

    return { backend, localPath };
}

export function createCricsheetsMatchSource(
    config: CricsheetsMatchSourceConfig,
): CricsheetsMatchSource {
    return backends[config.backend](config);
}

export function createCricsheetsMatchSourceFromEnv(
    env: NodeJS.ProcessEnv = process.env,
): CricsheetsMatchSource {
    return createCricsheetsMatchSource(parseCricsheetsMatchSourceConfig(env));
}
