import { Team } from "@/contexts/team/domain/models/team";

export interface TeamRepository {
    findById(teamId: string): Promise<Team | null>;
    save(team: Team): Promise<void>;
}
