import { eq } from "drizzle-orm";
import { Team } from "@/domain/team/models/team";
import { TeamRepository } from "@/domain/team/repositories/team-repository";
import { Venue } from "@/domain/venue/models/venue";
import { Database } from "@/infrastructure/persistence/postgres/client";
import { teams, venues } from "@/infrastructure/persistence/postgres/schema";

export class PostgresTeamRepository implements TeamRepository {
    public constructor(private readonly db: Database) {}

    public async findById(teamId: string): Promise<Team | null> {
        const rows = await this.db
            .select({
                teamId: teams.id,
                teamName: teams.name,
                homeVenueId: teams.homeVenueId,
                venueName: venues.name,
                venueCity: venues.city,
                venueCountry: venues.country,
            })
            .from(teams)
            .innerJoin(venues, eq(teams.homeVenueId, venues.id))
            .where(eq(teams.id, teamId))
            .limit(1);

        const row = rows[0];
        if (!row) {
            return null;
        }

        const homeVenue = Venue.create(
            row.homeVenueId,
            row.venueName,
            row.venueCity,
            row.venueCountry,
        );

        return Team.create(row.teamId, row.teamName, homeVenue);
    }

    public async save(team: Team): Promise<void> {
        await this.db
            .insert(teams)
            .values({
                id: team.getTeamId(),
                name: team.getTeamName(),
                homeVenueId: team.getHomeVenue().getVenueId(),
            })
            .onConflictDoUpdate({
                target: teams.id,
                set: {
                    name: team.getTeamName(),
                    homeVenueId: team.getHomeVenue().getVenueId(),
                },
            });
    }
}
