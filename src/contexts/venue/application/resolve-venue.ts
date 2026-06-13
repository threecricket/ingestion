import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { Venue } from "@/contexts/venue/domain/models/venue";
import { VenueRepository } from "@/contexts/venue/domain/repositories/venue-repository";
import { VenueIdentityInput } from "@/contexts/venue/identity/venue-identity-input";

export class ResolveVenueUseCase {
    public constructor(
        private readonly entityResolver: EntityResolver,
        private readonly identityHasherFactory: IdentityHasherFactory,
        private readonly venueRepository: VenueRepository,
    ) {}

    public async execute(
        input: VenueIdentityInput,
        defaults: { city?: string; country?: string } = {},
    ): Promise<Venue> {
        return this.entityResolver.resolveOrCreate({
            canonicalIdentity: this.identityHasherFactory.toCanonicalIdentity(EntityType.VENUE, input),
            findEntity: (id) => this.venueRepository.findById(id),
            saveEntity: (venue) => this.venueRepository.save(venue),
            createEntity: (id) => Venue.create(
                id,
                input.venueName,
                defaults.city ?? "Unknown",
                defaults.country ?? "Unknown",
            ),
        });
    }
}
