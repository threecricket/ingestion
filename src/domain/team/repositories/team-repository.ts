import { Team } from "@/domain/team/models/team";

export interface TeamRepository {
    findById(teamId: string): Team | null;
    save(team: Team): void;
}
