import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MatchFormat } from "@/contexts/match/domain/models/match";
import { ModelGateway, ModelTrainResult, ModelTrainScope } from "@/contexts/statistic/domain/ports/model-gateway";
import {
    WIN_PROBABILITY_MODEL_NAME,
    WinProbabilityService,
    winProbabilityTrainingWindowStart,
} from "@/contexts/statistic/domain/services/win-probability-service";
import { buildTestMatch } from "@/contexts/statistic/__tests__/fixtures/test-match-fixture";

const TRAINING_WINDOW_START = "2024-01-01";

function createService(gateway: ModelGateway): WinProbabilityService {
    return new WinProbabilityService(gateway, undefined, undefined, TRAINING_WINDOW_START);
}

interface RecordedPredict {
    model: string;
    filters: Record<string, string[]>;
    inputLength: number;
}

class FakeModelGateway implements ModelGateway {
    public readonly trainScopes: { model: string; scope: ModelTrainScope }[] = [];
    public readonly predictCalls: RecordedPredict[] = [];

    public async train(model: string, scope: ModelTrainScope): Promise<ModelTrainResult> {
        this.trainScopes.push({ model, scope });
        return { trained: true, rowsUsed: 1 };
    }

    public async predict(
        model: string,
        filters: Record<string, string[]>,
        input: Record<string, number[]>,
    ): Promise<number[]> {
        const length = input.current_innings_runs.length;
        this.predictCalls.push({ model, filters, inputLength: length });
        const inning = Number(filters.innings[0]);
        return Array.from({ length }, (_, position) => inning * 100 + position);
    }
}

describe("WinProbabilityService", () => {
    it("trains one model per (format, innings) scope within the training window and only once", async () => {
        const gateway = new FakeModelGateway();
        const service = createService(gateway);

        await service.prepare();
        await service.prepare();

        assert.equal(gateway.trainScopes.length, 4);
        assert.deepEqual(
            gateway.trainScopes.map(({ model, scope }) => ({ model, filters: scope.filters })),
            [
                { model: WIN_PROBABILITY_MODEL_NAME, filters: { format: ["t20"], innings: ["1"], start_date: [TRAINING_WINDOW_START] } },
                { model: WIN_PROBABILITY_MODEL_NAME, filters: { format: ["t20"], innings: ["2"], start_date: [TRAINING_WINDOW_START] } },
                { model: WIN_PROBABILITY_MODEL_NAME, filters: { format: ["odi"], innings: ["1"], start_date: [TRAINING_WINDOW_START] } },
                { model: WIN_PROBABILITY_MODEL_NAME, filters: { format: ["odi"], innings: ["2"], start_date: [TRAINING_WINDOW_START] } },
            ],
        );
    });

    it("predicts per innings and reassembles in delivery order", async () => {
        const gateway = new FakeModelGateway();
        const service = createService(gateway);

        const match = buildTestMatch({
            format: MatchFormat.T20,
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [
                        { batterId: "batter-a", bowlerId: "bowler-1" },
                        { batterId: "batter-b", bowlerId: "bowler-1" },
                    ],
                },
                {
                    inningNumber: 2,
                    battingTeamId: "bowling-team",
                    bowlingTeamId: "batting-team",
                    target: 10,
                    deliveries: [{ batterId: "batter-c", bowlerId: "bowler-2" }],
                },
            ],
        });

        const predictions = await service.predictForMatch(match);

        assert.deepEqual(predictions, [100, 101, 200]);
        assert.equal(gateway.predictCalls.length, 2);
        assert.deepEqual(gateway.predictCalls[0].filters, { format: ["t20"], innings: ["1"], start_date: [TRAINING_WINDOW_START] });
        assert.equal(gateway.predictCalls[0].inputLength, 2);
        assert.deepEqual(gateway.predictCalls[1].filters, { format: ["t20"], innings: ["2"], start_date: [TRAINING_WINDOW_START] });
        assert.equal(gateway.predictCalls[1].inputLength, 1);
    });

    it("memoizes predictions per match", async () => {
        const gateway = new FakeModelGateway();
        const service = createService(gateway);

        const match = buildTestMatch({
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [{ batterId: "batter-a", bowlerId: "bowler-1" }],
                },
            ],
        });

        await service.predictForMatch(match);
        await service.predictForMatch(match);

        assert.equal(gateway.predictCalls.length, 1);
    });

    it("returns no predictions for unsupported formats", async () => {
        const gateway = new FakeModelGateway();
        const service = createService(gateway);

        const match = buildTestMatch({
            format: MatchFormat.TEST,
            innings: [
                {
                    inningNumber: 1,
                    battingTeamId: "batting-team",
                    bowlingTeamId: "bowling-team",
                    deliveries: [{ batterId: "batter-a", bowlerId: "bowler-1" }],
                },
            ],
        });

        const predictions = await service.predictForMatch(match);

        assert.deepEqual(predictions, []);
        assert.equal(gateway.predictCalls.length, 0);
    });
});

describe("winProbabilityTrainingWindowStart", () => {
    it("returns the UTC date two years before the reference", () => {
        const start = winProbabilityTrainingWindowStart(new Date("2026-06-27T07:54:00Z"));
        assert.equal(start, "2024-06-27");
    });

    it("honours a custom window length", () => {
        const start = winProbabilityTrainingWindowStart(new Date("2026-03-15T00:00:00Z"), 5);
        assert.equal(start, "2021-03-15");
    });
});
