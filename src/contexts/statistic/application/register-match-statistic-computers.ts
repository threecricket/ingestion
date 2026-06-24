import { MatchStatisticComputer } from "@/contexts/statistic/domain/computation/match-statistic-computer";
import { MatchStatisticComputerRegistry } from "@/contexts/statistic/domain/computation/match-statistic-registry";
import { PlayerRunsScoredStatistic } from "@/contexts/statistic/domain/computation/player/player-runs-scored-statistic";
import { PlayerBallsFacedStatistic } from "@/contexts/statistic/domain/computation/player/player-balls-faced-statistic";
import { PlayerGotOutStatistic } from "@/contexts/statistic/domain/computation/player/player-got-out-statistic";
import { PlayerWicketsTakenStatistic } from "@/contexts/statistic/domain/computation/player/player-wickets-taken-statistic";
import { PlayerBallsBowledStatistic } from "@/contexts/statistic/domain/computation/player/player-balls-bowled-statistic";
import { PlayerRunsConcededStatistic } from "@/contexts/statistic/domain/computation/player/player-runs-conceded-statistic";
import { PlayerBattingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-batting-wpa-statistic";
import { PlayerBowlingWpaStatistic } from "@/contexts/statistic/domain/computation/player/player-bowling-wpa-statistic";
import { VenueFirstInningsScoreStatistic } from "@/contexts/statistic/domain/computation/venue/venue-first-innings-score-statistic";
import { VenueSecondInningsScoreStatistic } from "@/contexts/statistic/domain/computation/venue/venue-second-innings-score-statistic";

export function createMatchStatisticComputers(): MatchStatisticComputer[] {
    return [
        new PlayerRunsScoredStatistic(),
        new PlayerBallsFacedStatistic(),
        new PlayerGotOutStatistic(),
        new PlayerWicketsTakenStatistic(),
        new PlayerBallsBowledStatistic(),
        new PlayerRunsConcededStatistic(),
        new PlayerBattingWpaStatistic(),
        new PlayerBowlingWpaStatistic(),
        new VenueFirstInningsScoreStatistic(),
        new VenueSecondInningsScoreStatistic(),
    ];
}

export function createMatchStatisticComputerRegistry(): MatchStatisticComputerRegistry {
    const registry = new MatchStatisticComputerRegistry();
    for (const computer of createMatchStatisticComputers()) {
        registry.register(computer);
    }
    return registry;
}
