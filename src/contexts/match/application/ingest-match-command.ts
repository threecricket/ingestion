import { MatchFormat, MatchResult } from "@/contexts/match/domain/models/match";
import { WicketType } from "@/contexts/match/domain/models/ball";
import { ResolvePlayerParams } from "@/contexts/player/application/resolve-player";

export interface MatchOutcomeCommand {
    winner?: string;
    result?: string;
}

export interface DeliveryCommand {
    batterName: string;
    bowlerName: string;
    nonStrikerName: string;
    actualDelivery: string;
    runs: {
        batter: number;
        extras: number;
        total: number;
    };
    extras?: {
        wides?: number;
        noballs?: number;
    };
    wicket?: {
        playerOutName: string;
        kind: string;
    };
}

export interface InningCommand {
    battingTeamName: string;
    target?: number;
    deliveries: DeliveryCommand[];
}

export interface IngestMatchCommand {
    startDate: Date;
    endDate: Date;
    format: MatchFormat;
    matchDate: string;
    matchType: string;
    venueName: string;
    teamNames: [string, string];
    outcome?: MatchOutcomeCommand;
    ballsPerOver: number;
    playerRegistry: Record<string, string>;
    squadPlayerNames: string[];
    resolvePlayerParams: (registryHash: string) => ResolvePlayerParams;
    innings: InningCommand[];
    buildMatchResult: (teamIdsByName: Record<string, string>) => MatchResult;
    mapWicketType: (kind: string) => WicketType;
    isBowlerWicket: (kind: string) => boolean;
}
