import { readFileSync } from "fs";
import { BowlingStyle, Handedness, Role } from "@/contexts/player/domain/models/player";

export interface CricsheetEnrichedPlayer {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    commonName: string | null;
    battingHand: Handedness | null;
    bowlingHand: Handedness | null;
    bowlingStyle: BowlingStyle | null;
    roles: Role[] | null;
    country: string | null;
}

export interface CricsheetPlayerEnrichmentFile {
    schemaVersion: number;
    updatedAt: string;
    players: Record<string, CricsheetEnrichedPlayer>;
}

export interface CricsheetPlayerEnrichmentLookup {
    resolveByRegistryHash(hash: string): CricsheetEnrichedPlayer;
    size(): number;
}

export class InMemoryCricsheetPlayerEnrichmentLookup implements CricsheetPlayerEnrichmentLookup {
    private readonly players: Map<string, CricsheetEnrichedPlayer>;

    public constructor(players: Record<string, CricsheetEnrichedPlayer>) {
        this.players = new Map(Object.entries(players));
    }

    public resolveByRegistryHash(hash: string): CricsheetEnrichedPlayer {
        const player = this.players.get(hash);
        if (!player) {
            throw new Error(`No enriched player data for Cricsheet hash: ${hash}`);
        }

        return player;
    }

    public size(): number {
        return this.players.size;
    }
}

export function loadCricsheetPlayerEnrichment(filePath: string): InMemoryCricsheetPlayerEnrichmentLookup {
    const raw = readFileSync(filePath, "utf8");
    const file = JSON.parse(raw) as CricsheetPlayerEnrichmentFile;

    if (!file.players) {
        throw new Error(`Invalid enrichment file: ${filePath}`);
    }

    return new InMemoryCricsheetPlayerEnrichmentLookup(file.players);
}
