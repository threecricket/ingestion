import { EntityType } from "@/domain/identity/models/entity-type";
import { CanonicalIdentity } from "@/domain/identity/models/canonical-identity";
import { IdentityHasher } from "@/domain/identity/hashing/identity-hasher";
import { MatchIdentityHasher } from "@/domain/identity/hashing/hashers/match-identity-hasher";
import { PlayerIdentityHasher } from "@/domain/identity/hashing/hashers/player-identity-hasher";
import { TeamIdentityHasher } from "@/domain/identity/hashing/hashers/team-identity-hasher";
import { VenueIdentityHasher } from "@/domain/identity/hashing/hashers/venue-identity-hasher";
import { MatchIdentityInput } from "@/domain/identity/hashing/inputs/match-identity-input";
import { PlayerIdentityInput } from "@/domain/identity/hashing/inputs/player-identity-input";
import { TeamIdentityInput } from "@/domain/identity/hashing/inputs/team-identity-input";
import { VenueIdentityInput } from "@/domain/identity/hashing/inputs/venue-identity-input";

export class IdentityHasherFactory {
    private readonly hashers: Record<EntityType, IdentityHasher<unknown>>;

    public constructor() {
        this.hashers = {
            [EntityType.PLAYER]: new PlayerIdentityHasher(),
            [EntityType.TEAM]: new TeamIdentityHasher(),
            [EntityType.VENUE]: new VenueIdentityHasher(),
            [EntityType.MATCH]: new MatchIdentityHasher(),
        };
    }

    public toCanonicalIdentity(entityType: EntityType.PLAYER, input: PlayerIdentityInput): CanonicalIdentity;
    public toCanonicalIdentity(entityType: EntityType.TEAM, input: TeamIdentityInput): CanonicalIdentity;
    public toCanonicalIdentity(entityType: EntityType.VENUE, input: VenueIdentityInput): CanonicalIdentity;
    public toCanonicalIdentity(entityType: EntityType.MATCH, input: MatchIdentityInput): CanonicalIdentity;
    public toCanonicalIdentity(
        entityType: EntityType,
        input: PlayerIdentityInput | TeamIdentityInput | VenueIdentityInput | MatchIdentityInput,
    ): CanonicalIdentity {
        const hasher = this.hashers[entityType];
        if (!hasher) {
            throw new Error(`No identity hasher registered for entity type: ${entityType}`);
        }

        return CanonicalIdentity.create(entityType, hasher.hash(input));
    }
}
