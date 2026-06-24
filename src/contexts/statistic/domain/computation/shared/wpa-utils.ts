export interface BallImpacts {
    battingImpact: number[];
    bowlingImpact: number[];
}

export function computeBallImpacts(winProbabilities: number[]): BallImpacts {
    const battingImpact: number[] = [];
    const bowlingImpact: number[] = [];

    for (let index = 0; index < winProbabilities.length; index += 1) {
        if (index === winProbabilities.length - 1) {
            battingImpact.push(0);
            bowlingImpact.push(0);
            continue;
        }

        const current = winProbabilities[index];
        const next = winProbabilities[index + 1];
        battingImpact.push(next - current);
        bowlingImpact.push(current - next);
    }

    return { battingImpact, bowlingImpact };
}
