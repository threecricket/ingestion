import { Venue } from "@/contexts/venue/domain/models/venue";

export class Team {
    private teamId: string;
    private teamName: string;
    private homeVenue: Venue;

    private constructor(teamId: string, teamName: string, homeVenue: Venue) {
        this.teamId = teamId;
        this.teamName = teamName;
        this.homeVenue = homeVenue;
    }

    public static create(teamId: string, teamName: string, homeVenue: Venue): Team {
        if (!teamId || !teamName || !homeVenue) {
            throw new Error("Invalid team data");
        }
        return new Team(teamId, teamName, homeVenue);
    }

    public getTeamId(): string {
        return this.teamId;
    }

    public getTeamName(): string {
        return this.teamName;
    }

    public getHomeVenue(): Venue {
        return this.homeVenue;
    }
}
