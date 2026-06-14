import { MatchFormat, MatchResult, ResultType } from "@/contexts/match/domain/models/match";
import { WicketType } from "@/contexts/match/domain/models/ball";
import {
    DeliveryCommand,
    IngestMatchCommand,
    InningCommand,
    MatchOutcomeCommand,
} from "@/contexts/match/application/ingest-match-command";
import { toResolvePlayerParams } from "@/contexts/ingestion/adapters/cricsheets/identity-inputs";
import { CricsheetPlayerEnrichmentLookup } from "@/contexts/ingestion/adapters/cricsheets/player-enrichment";

const FORMAT_MAP: Record<string, MatchFormat> = {
    "TEST": MatchFormat.TEST,
    "ODI": MatchFormat.ODI,
    "T20": MatchFormat.T20,
};

interface CricsheetsDelivery {
    actual_delivery: string;
    batter: string;
    bowler: string;
    non_striker: string;
    runs: {
        batter: number;
        extras: number;
        total: number;
    };
    extras?: {
        wides?: number;
        noballs?: number;
    };
    wickets?: Array<{
        player_out: string;
        kind: string;
    }>;
}

interface CricsheetsInning {
    team: string;
    overs: Array<{
        over: number;
        deliveries: CricsheetsDelivery[];
    }>;
    target?: {
        overs: number;
        runs: number;
    };
}

export interface CricsheetsMatchObject {
    info: {
        balls_per_over?: number;
        dates: string[];
        match_type: string;
        teams: string[];
        venue: string;
        outcome?: MatchOutcomeCommand;
        players?: Record<string, string[]>;
        registry?: {
            people?: Record<string, string>;
        };
    };
    innings: CricsheetsInning[];
}

export class CricsheetsMatchMapper {
    public constructor(private readonly playerEnrichment: CricsheetPlayerEnrichmentLookup) {}

    public toIngestCommand(matchObject: CricsheetsMatchObject): IngestMatchCommand {
        const startDate = new Date(matchObject.info.dates[0]);
        const endDate = new Date(matchObject.info.dates[matchObject.info.dates.length - 1]);
        const format = FORMAT_MAP[matchObject.info.match_type];

        if (!format) {
            throw new Error(`Unsupported match type: ${matchObject.info.match_type}`);
        }

        if (matchObject.info.teams.length !== 2) {
            throw new Error(`Expected exactly 2 teams, found ${matchObject.info.teams.length}`);
        }

        const playerRegistry = matchObject.info.registry?.people ?? {};
        const squadPlayerNames = Object.values(matchObject.info.players ?? {}).flat();

        return {
            startDate,
            endDate,
            format,
            matchDate: matchObject.info.dates[0],
            matchType: matchObject.info.match_type,
            venueName: matchObject.info.venue,
            teamNames: [matchObject.info.teams[0], matchObject.info.teams[1]],
            outcome: matchObject.info.outcome,
            ballsPerOver: matchObject.info.balls_per_over ?? 6,
            playerRegistry,
            squadPlayerNames,
            resolvePlayerParams: (registryHash) => {
                const enriched = this.playerEnrichment.resolveByRegistryHash(registryHash);
                return toResolvePlayerParams(enriched);
            },
            innings: this.mapInnings(matchObject.innings),
            buildMatchResult: (teamIdsByName) => this.buildMatchResult(matchObject.info.outcome, teamIdsByName),
            mapWicketType: (kind) => this.mapWicketType(kind),
            isBowlerWicket: (kind) => this.isBowlerWicket(kind),
        };
    }

    private mapInnings(innings: CricsheetsInning[]): InningCommand[] {
        return innings.map((inning) => ({
            battingTeamName: inning.team,
            target: inning.target?.runs,
            deliveries: inning.overs.flatMap((over) =>
                over.deliveries.map((delivery) => this.mapDelivery(delivery)),
            ),
        }));
    }

    private mapDelivery(delivery: CricsheetsDelivery): DeliveryCommand {
        const wicket = delivery.wickets?.[0];

        return {
            batterName: delivery.batter,
            bowlerName: delivery.bowler,
            nonStrikerName: delivery.non_striker,
            actualDelivery: delivery.actual_delivery,
            runs: delivery.runs,
            extras: delivery.extras,
            wicket: wicket
                ? { playerOutName: wicket.player_out, kind: wicket.kind }
                : undefined,
        };
    }

    private buildMatchResult(
        outcome: MatchOutcomeCommand | undefined,
        teamIdsByName: Record<string, string>,
    ): MatchResult {
        if (outcome?.winner) {
            const winnerTeamId = teamIdsByName[outcome.winner];
            if (!winnerTeamId) {
                throw new Error(`Unknown winning team: ${outcome.winner}`);
            }

            return MatchResult.create(ResultType.WON, winnerTeamId);
        }

        if (outcome?.result === "tie") {
            return MatchResult.create(ResultType.TIE, null);
        }

        if (outcome?.result === "no result") {
            return MatchResult.create(ResultType.NO_RESULT, null);
        }

        throw new Error("Match outcome is missing or unsupported");
    }

    private mapWicketType(kind: string): WicketType {
        switch (kind.toLowerCase()) {
            case "bowled":
            case "caught and bowled":
                return WicketType.BOWLED;
            case "caught":
                return WicketType.CAUGHT;
            case "lbw":
                return WicketType.LBW;
            case "stumped":
                return WicketType.STUMPED;
            case "run out":
                return WicketType.RUN_OUT;
            case "hit wicket":
                return WicketType.HIT_WICKET;
            case "obstructing the field":
                return WicketType.OBSTRUCTING;
            default:
                return WicketType.OTHER;
        }
    }

    private isBowlerWicket(kind: string): boolean {
        const normalized = kind.toLowerCase();
        return normalized !== "run out"
            && normalized !== "obstructing the field"
            && normalized !== "retired out";
    }
}
