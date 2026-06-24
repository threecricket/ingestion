import { MatchFormat } from "@/contexts/match/domain/models/match";

export const FORMAT_MAX_LEGAL_BALLS: Record<MatchFormat, number | null> = {
    [MatchFormat.T20]: 120,
    [MatchFormat.ODI]: 300,
    [MatchFormat.TEST]: null,
};

export function isWinProbabilitySupportedFormat(format: MatchFormat): boolean {
    return format === MatchFormat.T20 || format === MatchFormat.ODI;
}
