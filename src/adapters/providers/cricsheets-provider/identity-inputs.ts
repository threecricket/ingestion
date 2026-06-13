import { MatchIdentityInput } from "@/domain/identity/hashing/inputs/match-identity-input";
import { PlayerIdentityInput } from "@/domain/identity/hashing/inputs/player-identity-input";
import { TeamIdentityInput } from "@/domain/identity/hashing/inputs/team-identity-input";
import { VenueIdentityInput } from "@/domain/identity/hashing/inputs/venue-identity-input";

export function parsePlayerName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: parts[0] };
    }

    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function toPlayerIdentityInput(playerName: string): PlayerIdentityInput {
    return { fullName: playerName.trim(), dateOfBirth: null };
}

export function toTeamIdentityInput(teamName: string): TeamIdentityInput {
    return { teamName };
}

export function toVenueIdentityInput(venueName: string): VenueIdentityInput {
    return { venueName };
}

export function toMatchIdentityInput(
    matchDate: string,
    format: string,
    team1Id: string,
    team2Id: string,
): MatchIdentityInput {
    return { matchDate, format, team1Id, team2Id };
}
