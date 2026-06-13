import { eq } from "drizzle-orm";
import { Venue } from "@/domain/venue/models/venue";
import { VenueRepository } from "@/domain/venue/repositories/venue-repository";
import { Database } from "@/infrastructure/persistence/postgres/client";
import { venues } from "@/infrastructure/persistence/postgres/schema";

type VenueRow = typeof venues.$inferSelect;

export class PostgresVenueRepository implements VenueRepository {
    public constructor(private readonly db: Database) {}

    public async findById(venueId: string): Promise<Venue | null> {
        const rows = await this.db
            .select()
            .from(venues)
            .where(eq(venues.id, venueId))
            .limit(1);

        const row = rows[0];
        return row ? this.toVenue(row) : null;
    }

    public async save(venue: Venue): Promise<void> {
        await this.db
            .insert(venues)
            .values(this.fromVenue(venue))
            .onConflictDoUpdate({
                target: venues.id,
                set: {
                    name: venue.getVenueName(),
                    city: venue.getCity(),
                    country: venue.getCountry(),
                },
            });
    }

    private toVenue(row: VenueRow): Venue {
        return Venue.create(row.id, row.name, row.city, row.country);
    }

    private fromVenue(venue: Venue) {
        return {
            id: venue.getVenueId(),
            name: venue.getVenueName(),
            city: venue.getCity(),
            country: venue.getCountry(),
        };
    }
}
