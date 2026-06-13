import { Venue } from "@/contexts/venue/domain/models/venue";

export interface VenueRepository {
    findById(venueId: string): Promise<Venue | null>;
    save(venue: Venue): Promise<void>;
}
