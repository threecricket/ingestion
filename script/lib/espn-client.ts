const ESPN_ATHLETE_API_URL = "http://core.espnuk.org/v2/sports/cricket/athletes";
const ESPN_TEAM_API_URL = "http://core.espnuk.org/v2/sports/cricket/teams";

export type Handedness = "right-hand" | "left-hand";
export type BowlingStyle = "fast" | "medium" | "spin" | "off-spin" | "leg-spin";
export type Role = "batter" | "bowler";

export interface EnrichedPlayer {
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

interface EspnStyle {
    description?: string;
    type?: string;
}

interface EspnPosition {
    name?: string;
}

interface EspnAthleteResponse {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    dateOfBirth?: string;
    style?: EspnStyle[];
    styles?: EspnStyle[];
    position?: EspnPosition;
    country?: number;
}

interface EspnTeamResponse {
    location?: string;
    name?: string;
}

function parseDateOfBirth(value: string | undefined): string | null {
    if (!value) {
        return null;
    }

    const date = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return null;
    }

    return date;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: parts[0] };
    }

    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function findStyle(styles: EspnStyle[], type: string): string | null {
    const match = styles.find((style) => style.type?.toLowerCase() === type);
    return match?.description?.trim() ?? null;
}

function mapBattingHand(description: string): Handedness | null {
    const lower = description.toLowerCase();
    if (lower.includes("right-hand")) {
        return "right-hand";
    }
    if (lower.includes("left-hand")) {
        return "left-hand";
    }
    return null;
}

function mapBowlingHand(description: string): Handedness | null {
    const lower = description.toLowerCase();
    if (lower.includes("left-arm") || lower.includes("left arm")) {
        return "left-hand";
    }
    if (lower.includes("right-arm") || lower.includes("right arm")) {
        return "right-hand";
    }
    if (lower.startsWith("slow left")) {
        return "left-hand";
    }
    return null;
}

function mapBowlingStyle(description: string): BowlingStyle | null {
    const lower = description.toLowerCase();

    if (
        lower.includes("legbreak")
        || lower.includes("leg break")
        || lower.includes("leg-spin")
        || lower.includes("leg spin")
        || lower.includes("googly")
        || lower.includes("chinaman")
    ) {
        return "leg-spin";
    }

    if (
        lower.includes("offbreak")
        || lower.includes("off break")
        || lower.includes("off-spin")
        || lower.includes("off spin")
        || lower.includes("orthodox")
    ) {
        return "off-spin";
    }

    if (lower.includes("fast")) {
        return "fast";
    }

    if (lower.includes("medium")) {
        return "medium";
    }

    if (lower.includes("spin") || lower.includes("break")) {
        return "spin";
    }

    return null;
}

function mapRoles(positionName: string | null, hasBowlingStyle: boolean): Role[] | null {
    if (!positionName) {
        if (hasBowlingStyle) {
            return ["batter", "bowler"];
        }
        return ["batter"];
    }

    const lower = positionName.toLowerCase();
    if (lower.includes("allrounder") || lower.includes("all-rounder")) {
        return ["batter", "bowler"];
    }
    if (lower.includes("bowler")) {
        return ["bowler"];
    }

    return ["batter"];
}

export function parseEspnAthleteResponse(
    espnId: string,
    payload: EspnAthleteResponse,
    country: string | null,
): EnrichedPlayer {
    const dateOfBirth = parseDateOfBirth(payload.dateOfBirth);
    if (!dateOfBirth) {
        throw new Error(`Missing date of birth for ESPN player ${espnId}`);
    }

    let firstName = payload.firstName?.trim() ?? "";
    let lastName = payload.lastName?.trim() ?? "";
    let fullName = payload.fullName?.trim() ?? "";

    if (!firstName || !lastName) {
        const fallbackName = fullName || payload.displayName?.trim();
        if (!fallbackName) {
            throw new Error(`Missing player name for ESPN player ${espnId}`);
        }

        const parsed = splitFullName(fallbackName);
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        if (!fullName) {
            fullName = fallbackName;
        }
    }

    if (!fullName) {
        fullName = `${firstName} ${lastName}`.trim();
    }

    if (!fullName) {
        throw new Error(`Missing full name for ESPN player ${espnId}`);
    }

    const styles = payload.styles ?? payload.style ?? [];
    const battingDescription = findStyle(styles, "batting");
    const bowlingDescription = findStyle(styles, "bowling");
    const battingHand = battingDescription ? mapBattingHand(battingDescription) : null;
    const bowlingHand = bowlingDescription ? mapBowlingHand(bowlingDescription) : null;
    const bowlingStyle = bowlingDescription ? mapBowlingStyle(bowlingDescription) : null;
    const roles = mapRoles(payload.position?.name ?? null, bowlingStyle !== null);
    const commonName = payload.displayName?.trim() || null;

    return {
        firstName,
        lastName,
        fullName,
        dateOfBirth,
        commonName,
        battingHand,
        bowlingHand,
        bowlingStyle,
        roles,
        country,
    };
}

export class EspnPlayerClient {
    private readonly maxAttempts: number;
    private readonly countryCache = new Map<number, string>();

    public constructor(maxAttempts = 3) {
        this.maxAttempts = maxAttempts;
    }

    private async fetchCountry(countryId: number): Promise<string | null> {
        const cached = this.countryCache.get(countryId);
        if (cached) {
            return cached;
        }

        const response = await fetch(`${ESPN_TEAM_API_URL}/${countryId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; threecricket-ingestion/1.0)",
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as EspnTeamResponse;
        const country = payload.location?.trim() || payload.name?.trim() || null;
        if (country) {
            this.countryCache.set(countryId, country);
        }

        return country;
    }

    public async fetchProfile(espnId: string): Promise<EnrichedPlayer> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
            try {
                const response = await fetch(`${ESPN_ATHLETE_API_URL}/${espnId}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; threecricket-ingestion/1.0)",
                        Accept: "application/json",
                    },
                });

                if (response.status === 404) {
                    throw new Error(`ESPN player not found: ${espnId}`);
                }

                if (!response.ok) {
                    throw new Error(`ESPN API error for ${espnId}: ${response.status} ${response.statusText}`);
                }

                const payload = await response.json() as EspnAthleteResponse;
                const country = payload.country
                    ? await this.fetchCountry(payload.country)
                    : null;

                return parseEspnAthleteResponse(espnId, payload, country);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < this.maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
                }
            }
        }

        throw lastError ?? new Error(`Failed to fetch ESPN player ${espnId}`);
    }
}

export function isProfileComplete(profile: EnrichedPlayer): boolean {
    return profile.fullName !== undefined
        && profile.commonName !== undefined
        && profile.battingHand !== undefined
        && profile.bowlingHand !== undefined
        && profile.bowlingStyle !== undefined
        && profile.roles !== undefined
        && profile.country !== undefined;
}
