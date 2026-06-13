import { eq } from "drizzle-orm";
import { Team } from "@/contexts/team/domain/models/team";
import { TeamRepository } from "@/contexts/team/domain/repositories/team-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { teams } from "@/contexts/team/infrastructure/postgres/schema";

export class PostgresTeamRepository implements TeamRepository {
    public constructor(private readonly db: Database) {}

    public async findById(teamId: string): Promise<Team | null> {
        const rows = await this.db
            .select({
                teamId: teams.id,
                teamName: teams.name,
            })
            .from(teams)
            .where(eq(teams.id, teamId))
            .limit(1);

        const row = rows[0];
        if (!row) {
            return null;
        }

        return Team.create(row.teamId, row.teamName);
    }

    public async save(team: Team): Promise<void> {
        await this.db
            .insert(teams)
            .values({
                id: team.getTeamId(),
                name: team.getTeamName(),
            })
            .onConflictDoUpdate({
                target: teams.id,
                set: {
                    name: team.getTeamName(),
                },
            });
    }
}
