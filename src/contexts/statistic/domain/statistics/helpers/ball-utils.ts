import { Ball, WicketType } from "@/contexts/match/domain/models/ball";

export function isLegalDelivery(ball: Ball): boolean {
    const result = ball.getBallResult();
    return !result.getWide() && !result.getNoBall();
}

export function runsOnDelivery(ball: Ball): number {
    const result = ball.getBallResult();
    return result.getRuns() + result.getExtras();
}

export function isBowlerWicket(wicketType: WicketType): boolean {
    return wicketType !== WicketType.RUN_OUT && wicketType !== WicketType.OBSTRUCTING;
}
