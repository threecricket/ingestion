import { ModelGateway, ModelTrainResult, ModelTrainScope } from "@/contexts/statistic/domain/ports/model-gateway";
import { ModelApiClient } from "./model-api-client";

export class ModelApiGateway implements ModelGateway {
    public constructor(private readonly modelApiClient: ModelApiClient) {}

    public async train(model: string, scope: ModelTrainScope): Promise<ModelTrainResult> {
        const response = await this.modelApiClient.train({
            model,
            options: {
                filters: scope.filters,
                hyperparams: scope.hyperparams,
                test_size: scope.testSize,
            },
        });

        return {
            trained: response.trained,
            rowsUsed: response.rows_used,
            message: response.message,
        };
    }

    public async predict(
        model: string,
        filters: Record<string, string[]>,
        input: Record<string, number[]>,
    ): Promise<number[]> {
        const response = await this.modelApiClient.predict({
            model,
            filters,
            input,
        });

        return response.predictions;
    }
}
