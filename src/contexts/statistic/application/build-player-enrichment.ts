import { Match } from "@/contexts/match/domain/models/match";
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";
import { PlayerEnrichmentInput } from "@/contexts/statistic/domain/ports/performance-gateway";

function collectPlayerIds(match: Match): string[] {
    const ids = new Set<string>();

    for (const inning of match.getInnings()) {
        for (const ball of inning.getBallList()) {
            ids.add(ball.getBatterId());
            ids.add(ball.getBowlerId());
            ids.add(ball.getNonStrikerId());

            const playerOutId = ball.getBallResult().getPlayerOutId();
            if (playerOutId) {
                ids.add(playerOutId);
            }
        }
    }

    return [...ids];
}

export async function buildPlayerEnrichment(
    match: Match,
    playerRepository: PlayerRepository,
): Promise<Record<string, PlayerEnrichmentInput>> {
    const players = await playerRepository.findByIds(collectPlayerIds(match));

    const enrichment: Record<string, PlayerEnrichmentInput> = {};
    for (const player of players) {
        enrichment[player.getPlayerId()] = {
            battingHand: player.getBattingHand(),
            bowlingHand: player.getBowlingHand(),
            bowlingStyle: player.getBowlingStyle(),
        };
    }

    return enrichment;
}
