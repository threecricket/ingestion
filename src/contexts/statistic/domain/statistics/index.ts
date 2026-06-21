import { MatchStatisticComputer } from "./match-statistic-computer";
import { PlayerRunsScoredStatistic } from "./player/player-runs-scored-statistic";
import { PlayerBallsFacedStatistic } from "./player/player-balls-faced-statistic";
import { PlayerGotOutStatistic } from "./player/player-got-out-statistic";
import { PlayerWicketsTakenStatistic } from "./player/player-wickets-taken-statistic";
import { PlayerBallsBowledStatistic } from "./player/player-balls-bowled-statistic";
import { PlayerRunsConcededStatistic } from "./player/player-runs-conceded-statistic";
import { VenueFirstInningsScoreStatistic } from "./venue/venue-first-innings-score-statistic";
import { VenueSecondInningsScoreStatistic } from "./venue/venue-second-innings-score-statistic";

export const ALL_MATCH_STATISTIC_COMPUTERS: MatchStatisticComputer[] = [
    new PlayerRunsScoredStatistic(),
    new PlayerBallsFacedStatistic(),
    new PlayerGotOutStatistic(),
    new PlayerWicketsTakenStatistic(),
    new PlayerBallsBowledStatistic(),
    new PlayerRunsConcededStatistic(),
    new VenueFirstInningsScoreStatistic(),
    new VenueSecondInningsScoreStatistic(),
];
