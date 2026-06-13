import { PlayerIdentityInput } from "@/contexts/player/identity/player-identity-input";
import { Player } from "@/contexts/player/domain/models/player";
import { ResolvePlayerParams } from "@/contexts/player/application/resolve-player";
import { CricsheetEnrichedPlayer } from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";

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

export function toResolvePlayerParams(enriched: CricsheetEnrichedPlayer): ResolvePlayerParams {
    return {
        identityInput: toPlayerIdentityInputFromEnrichment(enriched),
        createPlayer: (id) => createPlayerFromEnrichment(id, enriched),
    };
}
