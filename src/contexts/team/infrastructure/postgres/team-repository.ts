import { eq } from "drizzle-orm";
import { Team } from "@/contexts/team/domain/models/team";
import { TeamRepository } from "@/contexts/team/domain/repositories/team-repository";
import { Venue } from "@/contexts/venue/domain/models/venue";
import { Database } from "@/shared/persistence/postgres/client";
import { teams } from "@/contexts/team/infrastructure/postgres/schema";
import { venues as venueTable } from "@/contexts/venue/infrastructure/postgres/schema";

export class PostgresTeamRepository implements TeamRepository {
    public constructor(private readonly db: Database) {}

    public async findById(teamId: string): Promise<Team | null> {
        const rows = await this.db
            .select({
                teamId: teams.id,
                teamName: teams.name,
                homeVenueId: teams.homeVenueId,
                venueName: venueTable.name,
                venueCity: venueTable.city,
                venueCountry: venueTable.country,
            })
            .from(teams)
            .innerJoin(venueTable, eq(teams.homeVenueId, venueTable.id))
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
