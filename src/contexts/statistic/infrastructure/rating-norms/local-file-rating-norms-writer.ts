import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { RatingNormsArtifact, RatingNormsWriter } from "@/contexts/statistic/domain/ports/rating-norms-writer";

export class LocalFileRatingNormsWriter implements RatingNormsWriter {
    public constructor(private readonly directory: string) {}

    public async write(artifact: RatingNormsArtifact): Promise<string> {
        const baseDir = join(this.directory, "rating-norms");
        await mkdir(baseDir, { recursive: true });

        await writeFile(
            join(baseDir, "latest.json"),
            JSON.stringify(artifact, null, 2),
            "utf8",
        );
        await writeFile(
            join(baseDir, "latest.metadata.json"),
            JSON.stringify({ updatedAt: artifact.updatedAt }, null, 2),
            "utf8",
        );

        return artifact.updatedAt;
    }
}
