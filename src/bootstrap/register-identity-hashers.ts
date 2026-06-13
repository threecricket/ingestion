import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { MatchIdentityHasher } from "@/contexts/match/identity/match-identity-hasher";
import { PlayerIdentityHasher } from "@/contexts/player/identity/player-identity-hasher";
import { TeamIdentityHasher } from "@/contexts/team/identity/team-identity-hasher";
import { VenueIdentityHasher } from "@/contexts/venue/identity/venue-identity-hasher";

export function registerIdentityHashers(factory: IdentityHasherFactory): void {
    factory.register(EntityType.PLAYER, new PlayerIdentityHasher());
    factory.register(EntityType.TEAM, new TeamIdentityHasher());
    factory.register(EntityType.VENUE, new VenueIdentityHasher());
    factory.register(EntityType.MATCH, new MatchIdentityHasher());
}
