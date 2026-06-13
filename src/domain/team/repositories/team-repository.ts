import { Team } from "@/domain/team/models/team";

export interface TeamRepository {
    findById(teamId: string): Promise<Team | null>;
    save(team: Team): Promise<void>;
}
