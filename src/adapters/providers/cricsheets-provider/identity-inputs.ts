import { MatchIdentityInput } from "@/domain/identity/hashing/inputs/match-identity-input";
import { PlayerIdentityInput } from "@/domain/identity/hashing/inputs/player-identity-input";
import { TeamIdentityInput } from "@/domain/identity/hashing/inputs/team-identity-input";
import { VenueIdentityInput } from "@/domain/identity/hashing/inputs/venue-identity-input";
import { Player } from "@/domain/player/models/player";
import { CricsheetEnrichedPlayer } from "./player-enrichment";

export function toPlayerIdentityInputFromEnrichment(enriched: CricsheetEnrichedPlayer): PlayerIdentityInput {
    return {
        fullName: enriched.fullName,
        dateOfBirth: enriched.dateOfBirth,
    };
}

export function createPlayerFromEnrichment(id: string, enriched: CricsheetEnrichedPlayer): Player {
    return Player.create(
        id,
        enriched.firstName,
        enriched.lastName,
        enriched.fullName,
        enriched.commonName,
        enriched.battingHand,
        enriched.bowlingHand,
        enriched.bowlingStyle,
        enriched.roles,
        enriched.country,
        new Date(enriched.dateOfBirth),
    );
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
