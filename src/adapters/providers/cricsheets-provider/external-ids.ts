import { normalize } from "@/domain/identity/hashing/normalize";

export { normalize };

export function cricsheetsPlayerExternalId(registryHash: string): string {
    return registryHash;
}

export function cricsheetsTeamExternalId(teamName: string): string {
    return normalize(teamName);
}

export function cricsheetsVenueExternalId(venueName: string): string {
    return normalize(venueName);
}

export function cricsheetsMatchExternalId(matchKey: string): string {
    const fileName = matchKey.split("/").pop() ?? matchKey;
    return fileName.replace(/\.json$/i, "");
}
