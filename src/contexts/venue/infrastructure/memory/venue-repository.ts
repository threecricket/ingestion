import { Venue } from "@/contexts/venue/domain/models/venue";
import { VenueRepository } from "@/contexts/venue/domain/repositories/venue-repository";

export function createInMemoryVenueRepository(): {
    repository: VenueRepository;
    count: () => number;
} {
    const venues = new Map<string, Venue>();

    return {
        repository: {
            findById: async (id) => venues.get(id) ?? null,
            save: async (venue) => { venues.set(venue.getVenueId(), venue); },
        },
        count: () => venues.size,
    };
}
