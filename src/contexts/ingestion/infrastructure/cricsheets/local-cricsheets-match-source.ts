import { readdir, readFile } from "fs/promises";
import { join, relative, resolve } from "path";
import { CricsheetsMatchSource } from "@/contexts/ingestion/adapters/cricsheets/ports/cricsheets-match-source";

const CRICSHEETS_PREFIX = "cricsheets/";

export class LocalCricsheetsMatchSource implements CricsheetsMatchSource {
    private readonly rootPath: string;

    public constructor(rootPath: string) {
        this.rootPath = resolve(rootPath);
    }

    public async listMatchKeys(): Promise<string[]> {
        const jsonFiles = await this.collectJsonFiles(this.rootPath);
        return jsonFiles.map((filePath) => {
            const relativePath = relative(this.rootPath, filePath).replace(/\\/g, "/");
            return `${CRICSHEETS_PREFIX}${relativePath}`;
        });
    }

    public async getMatch(key: string): Promise<unknown> {
        const relativePath = key.startsWith(CRICSHEETS_PREFIX)
            ? key.slice(CRICSHEETS_PREFIX.length)
            : key;
        const filePath = resolve(this.rootPath, relativePath);

        if (!filePath.startsWith(this.rootPath)) {
            throw new Error(`Invalid match key: ${key}`);
        }

        const body = await readFile(filePath, "utf8");
        if (!body) {
            throw new Error(`No body found for match: ${key}`);
        }

        return JSON.parse(body);
    }

    private async collectJsonFiles(directory: string): Promise<string[]> {
        const entries = await readdir(directory, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                files.push(...await this.collectJsonFiles(entryPath));
            } else if (entry.isFile() && entry.name.endsWith(".json")) {
                files.push(entryPath);
            }
        }

        return files;
    }
}
