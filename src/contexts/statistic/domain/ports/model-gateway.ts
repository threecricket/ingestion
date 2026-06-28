export interface ModelTrainScope {
    filters: Record<string, string[]>;
    hyperparams?: Record<string, unknown>;
    testSize?: number;
}

export interface ModelTrainResult {
    trained: boolean;
    rowsUsed: number;
    message?: string | null;
}

export interface ModelGateway {
    train(model: string, scope: ModelTrainScope): Promise<ModelTrainResult>;
    predict(
        model: string,
        filters: Record<string, string[]>,
        input: Record<string, number[]>,
    ): Promise<number[]>;
}
