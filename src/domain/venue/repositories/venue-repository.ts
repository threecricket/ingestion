import { Venue } from "@/domain/venue/models/venue";

export interface VenueRepository {
    findById(venueId: string): Promise<Venue | null>;
    save(venue: Venue): Promise<void>;
}
