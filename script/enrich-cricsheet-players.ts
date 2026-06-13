import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { RegisterClient } from "./lib/register-client";
import { parsePeopleCsv, CricsheetEspnEntry } from "./lib/parse-people-csv";
import { EspnPlayerClient, EnrichedPlayer, isProfileComplete } from "./lib/espn-client";

const DATA_DIR = join(process.cwd(), "data");
const OUTPUT_FILENAME = "cricsheet-player-enriched.json";
const SCHEMA_VERSION = 4;
const CONCURRENCY = 8;
const PROGRESS_EVERY = 25;

export interface CricsheetPlayerEnrichedFile {
    schemaVersion: number;
    updatedAt: string;
    players: Record<string, EnrichedPlayer>;
}

function log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function formatPlayer(profile: EnrichedPlayer): string {
    const roles = profile.roles?.join("/") ?? "n/a";
    const bat = profile.battingHand ?? "n/a";
    const bowl = profile.bowlingStyle
        ? `${profile.bowlingHand ?? "?"} ${profile.bowlingStyle}`
        : "n/a";
    const country = profile.country ?? "n/a";
    const commonName = profile.commonName ?? "n/a";

    return `${profile.fullName} (${profile.dateOfBirth})`
        + ` common=${commonName} country=${country} roles=${roles} bat=${bat} bowl=${bowl}`;
}

async function mapWithConcurrency<T>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<void>,
): Promise<void> {
    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            await mapper(items[currentIndex]);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
    );
}

function loadExistingOutput(path: string): CricsheetPlayerEnrichedFile | null {
    if (!existsSync(path)) {
        return null;
    }

    return JSON.parse(readFileSync(path, "utf8")) as CricsheetPlayerEnrichedFile;
}

function saveOutput(path: string, output: CricsheetPlayerEnrichedFile): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(output, null, 2));
}

function isOutputStale(cachedUpdatedAt: string, remoteLastModified: string | null): boolean {
    if (!remoteLastModified) {
        return false;
    }

    const cachedTime = Date.parse(cachedUpdatedAt);
    const remoteTime = Date.parse(remoteLastModified);

    if (Number.isNaN(cachedTime) || Number.isNaN(remoteTime)) {
        return true;
    }

    return remoteTime > cachedTime;
}

function needsEnrichment(
    entry: CricsheetEspnEntry,
    players: Record<string, EnrichedPlayer>,
    schemaVersion: number,
): boolean {
    if (schemaVersion !== SCHEMA_VERSION) {
        return true;
    }

    const existing = players[entry.cricsheetId];
    if (!existing) {
        return true;
    }

    return !isProfileComplete(existing);
}

async function main(): Promise<void> {
    const outputPath = join(DATA_DIR, OUTPUT_FILENAME);
    const registerClient = new RegisterClient();
    const espnClient = new EspnPlayerClient();

    log(`Output file: ${outputPath}`);

    log("Checking Cricsheet register freshness...");
    const existing = loadExistingOutput(outputPath);
    const remoteLastModified = await registerClient.fetchRemoteLastModified();
    const existingSchemaVersion = existing?.schemaVersion ?? 0;

    if (existing) {
        log(
            `Found existing enriched file (${Object.keys(existing.players).length} players,`
            + ` schema v${existingSchemaVersion}, updated ${existing.updatedAt})`,
        );
        log(`Remote register last modified: ${remoteLastModified ?? "unknown"}`);
    } else {
        log("No existing enriched file found");
    }

    const registerIsFresh = existing
        && !isOutputStale(existing.updatedAt, remoteLastModified)
        && existingSchemaVersion === SCHEMA_VERSION;

    if (registerIsFresh) {
        const incompleteCount = Object.values(existing!.players).filter((player) => !isProfileComplete(player)).length;
        if (incompleteCount === 0) {
            log("Register and enriched data are up to date — skipping enrichment");
            return;
        }

        log(`Register is fresh but ${incompleteCount} players have incomplete profiles — continuing enrichment`);
    } else if (existing) {
        if (existingSchemaVersion !== SCHEMA_VERSION) {
            log(`Schema upgrade v${existingSchemaVersion} → v${SCHEMA_VERSION} — re-enriching players`);
        } else {
            log("Register is newer than cached output — refreshing enrichment");
        }
    }

    log("Downloading Cricsheet people.csv...");
    const download = await registerClient.fetchPeopleCsv();
    const entries = parsePeopleCsv(download.csv);
    log(`Parsed ${entries.length} Cricsheet players with ESPN IDs (register updated ${download.lastModified ?? "unknown"})`);

    const players: Record<string, EnrichedPlayer> = existingSchemaVersion === SCHEMA_VERSION
        ? (existing?.players ?? {})
        : {};
    const cachedCount = Object.keys(players).length;
    const pending = entries.filter((entry) => needsEnrichment(entry, players, existingSchemaVersion));
    const skippedCount = entries.length - pending.length;

    log(`Already enriched: ${skippedCount}, pending ESPN fetch: ${pending.length}, concurrency: ${CONCURRENCY}`);

    if (pending.length === 0) {
        log("Nothing to fetch — saving updated timestamp only");
        saveOutput(outputPath, {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: download.lastModified ?? new Date().toISOString(),
            players,
        });
        log(`Done. ${Object.keys(players).length} players in ${OUTPUT_FILENAME}`);
        return;
    }

    let fetchedCount = 0;
    let failedCount = 0;
    let completedCount = 0;

    await mapWithConcurrency(pending, CONCURRENCY, async (entry: CricsheetEspnEntry) => {
        try {
            const profile = await espnClient.fetchProfile(entry.espnId);
            players[entry.cricsheetId] = profile;
            fetchedCount += 1;
            completedCount += 1;

            log(
                `[${completedCount}/${pending.length}] OK`
                + ` cricsheet=${entry.cricsheetId} espn=${entry.espnId}`
                + ` → ${formatPlayer(players[entry.cricsheetId])}`,
            );
        } catch (error) {
            failedCount += 1;
            completedCount += 1;
            const message = error instanceof Error ? error.message : String(error);

            log(
                `[${completedCount}/${pending.length}] FAIL`
                + ` cricsheet=${entry.cricsheetId} espn=${entry.espnId}`
                + ` name=${entry.cricsheetName}`
                + ` — ${message}`,
            );
        }

        if (completedCount % PROGRESS_EVERY === 0 || completedCount === pending.length) {
            log(
                `Progress: ${completedCount}/${pending.length} processed`
                + ` (${fetchedCount} ok, ${failedCount} failed, ${Object.keys(players).length} total enriched)`,
            );
        }
    });

    log(`Writing ${OUTPUT_FILENAME}...`);
    const output: CricsheetPlayerEnrichedFile = {
        schemaVersion: SCHEMA_VERSION,
        updatedAt: download.lastModified ?? new Date().toISOString(),
        players,
    };

    saveOutput(outputPath, output);

    log("Done.");
    log(`  output:   ${outputPath}`);
    log(`  schema:   v${SCHEMA_VERSION}`);
    log(`  enriched: ${Object.keys(players).length}`);
    log(`  cached:   ${cachedCount}`);
    log(`  fetched:  ${fetchedCount}`);
    log(`  failed:   ${failedCount}`);
}

main().catch((error: unknown) => {
    console.error(`[${new Date().toISOString()}] Cricsheet player enrichment failed:`, error);
    process.exit(1);
});
