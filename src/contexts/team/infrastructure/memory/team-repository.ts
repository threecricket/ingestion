import { Team } from "@/contexts/team/domain/models/team";
import { TeamRepository } from "@/contexts/team/domain/repositories/team-repository";

export function createInMemoryTeamRepository(): {
    repository: TeamRepository;
    count: () => number;
} {
    const teams = new Map<string, Team>();

    return {
        repository: {
            findById: async (id) => teams.get(id) ?? null,
            save: async (team) => { teams.set(team.getTeamId(), team); },
        },
        count: () => teams.size,
    };
}
