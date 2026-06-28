import "@/config/load-env";
import { Match } from "@/contexts/match/domain/models/match";
import { runIngestionPipeline } from "@/bootstrap/ingestion-pipeline";

function printMatchSummary(match: Match): void {
    const result = match.getMatchResult();

    console.log(`Match ID:      ${match.getMatchId()}`);
    console.log(`Format:        ${match.getMatchFormat()}`);
    console.log(`Start date:    ${match.getMatchStartDate().toISOString().slice(0, 10)}`);
    console.log(`End date:      ${match.getMatchEndDate().toISOString().slice(0, 10)}`);
    console.log(`Venue ID:      ${match.getMatchVenueId()}`);
    console.log(`Team 1 ID:     ${match.getMatchTeam1Id()}`);
    console.log(`Team 2 ID:     ${match.getMatchTeam2Id()}`);
    console.log(`Result:        ${result.getResultType()}${result.getSubjectTeamId() ? ` (${result.getSubjectTeamId()})` : ""}`);
    console.log(`Innings:       ${match.getInnings().length}`);

    for (const inning of match.getInnings()) {
        console.log(
            `  Inning ${inning.getInningNumber()}: ${inning.getInningRuns()}/${inning.getInningWickets()}`
            + ` in ${inning.getInningOvers()}.${inning.getInningBalls()} overs`
            + `, target=${inning.getTarget() ?? "n/a"}`
            + `, deliveries=${inning.getBallList().length}`,
        );
    }
}

async function main(): Promise<void> {
    console.log("Starting ingestion pipeline...\n");
    const pipeline = await runIngestionPipeline();

    try {
        const { providerResults, statisticsComputed, counts } = pipeline.result;

        let totalMatches = 0;

        for (const { providerId, matches } of providerResults) {
            console.log(`\n--- ${providerId}: ${matches.length} match(es) ---\n`);

            for (const match of matches) {
                printMatchSummary(match);
                console.log();
            }

            totalMatches += matches.length;
        }

        if (totalMatches === 0) {
            console.log("No matches ingested.");
            return;
        }

        if (counts) {
            const entityCounts = counts();
            console.log("Registered entities:");
            console.log(`  Players:          ${entityCounts.players}`);
            console.log(`  Teams:            ${entityCounts.teams}`);
            console.log(`  Venues:           ${entityCounts.venues}`);
            console.log(`  Matches:          ${entityCounts.matches}`);
            console.log(`  Match statistics: ${entityCounts.matchStatistics}`);
        }

        console.log(`\nPipeline finished: ${totalMatches} match(es), ${statisticsComputed} statistic(s).`);
    } finally {
        if (pipeline.close) {
            await pipeline.close();
        }
    }
}

main().catch((error: unknown) => {
    console.error("Ingestion pipeline failed:", error);
    process.exit(1);
});
