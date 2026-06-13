export class Team {
    private teamId: string;
    private teamName: string;

    private constructor(teamId: string, teamName: string) {
        this.teamId = teamId;
        this.teamName = teamName;
    }

    public static create(teamId: string, teamName: string): Team {
        if (!teamId || !teamName) {
            throw new Error("Invalid team data");
        }
        return new Team(teamId, teamName);
    }

    public getTeamId(): string {
        return this.teamId;
    }

    public getTeamName(): string {
        return this.teamName;
    }
}
