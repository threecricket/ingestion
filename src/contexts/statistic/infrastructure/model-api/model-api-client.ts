import { PredictRequest, PredictResponse, TrainRequest, TrainResponse } from "./types";

export class ModelApiClient {
    public constructor(private readonly baseUrl: string) {}

    public async predict(request: PredictRequest): Promise<PredictResponse> {
        const response = await fetch(`${this.baseUrl}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`model-api predict failed (${response.status}): ${body}`);
        }

        return response.json() as Promise<PredictResponse>;
    }

    public async train(request: TrainRequest): Promise<TrainResponse> {
        const response = await fetch(`${this.baseUrl}/train`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`model-api train failed (${response.status}): ${body}`);
        }

        return response.json() as Promise<TrainResponse>;
    }
}
