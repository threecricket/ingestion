import { Venue } from "@/domain/venue/models/venue";

export interface VenueRepository {
    findById(venueId: string): Venue | null;
    save(venue: Venue): void;
}
