import { createS3Client } from "@/contexts/ingestion/infrastructure/aws/s3-client";
import { RatingNormsWriter } from "@/contexts/statistic/domain/ports/rating-norms-writer";
import { LocalFileRatingNormsWriter } from "./local-file-rating-norms-writer";
import { parseS3Uri, S3RatingNormsWriter } from "./s3-rating-norms-writer";

/**
 * Selects the rating-norms output target from the environment, mirroring how
 * performance-api selects its read source: prefer S3 (`RATING_NORMS_S3_URI`),
 * else a local directory (`RATING_NORMS_PATH`). Returns null when neither is
 * configured, in which case the orchestrator skips norms publishing + ratings.
 */
export function createRatingNormsWriter(): RatingNormsWriter | null {
    const s3Uri = process.env.RATING_NORMS_S3_URI?.trim();
    if (s3Uri) {
        return new S3RatingNormsWriter(createS3Client(), parseS3Uri(s3Uri));
    }

    const localPath = process.env.RATING_NORMS_PATH?.trim();
    if (localPath) {
        return new LocalFileRatingNormsWriter(localPath);
    }

    return null;
}
