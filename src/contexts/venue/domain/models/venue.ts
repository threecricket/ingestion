export class Venue {
    private venueId: string;
    private venueName: string;
    private city: string;
    private country: string;

    private constructor(venueId: string, venueName: string, city: string, country: string) {
        this.venueId = venueId;
        this.venueName = venueName;
        this.city = city;
        this.country = country;
    }

    public static create(venueId: string, venueName: string, city: string, country: string): Venue {
        if (!venueId || !venueName || !city || !country) {
            throw new Error("Invalid venue data");
        }
        return new Venue(venueId, venueName, city, country);
    }

    public getVenueId(): string {
        return this.venueId;
    }

    public getVenueName(): string {
        return this.venueName;
    }

    public getCity(): string {
        return this.city;
    }

    public getCountry(): string {
        return this.country;
    }
}
