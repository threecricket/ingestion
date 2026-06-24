import { Match } from "@/contexts/match/domain/models/match";
import { MatchStatistic, MatchStatisticType } from "../../models/match-statistic";
import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { BaseMatchStatisticComputer } from "../match-statistic-computer";

export class VenueFirstInningsScoreStatistic extends BaseMatchStatisticComputer {
    private static readonly TYPE = MatchStatisticType.create(
        "venue_first_innings_score",
        "First Innings Score",
        "First innings total at venue",
        EntityType.VENUE,
    );

    public getType(): MatchStatisticType {
        return VenueFirstInningsScoreStatistic.TYPE;
    }

    public compute(match: Match): MatchStatistic[] {
        const inning = match.getInnings().find((entry) => entry.getInningNumber() === 1);
        const runs = inning?.getInningRuns() ?? 0;

        return [this.createStatistic(match, match.getMatchVenueId(), runs)];
    }
}
