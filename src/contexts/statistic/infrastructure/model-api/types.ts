export interface PredictRequest {
    model: string;
    input: Record<string, number[]>;
    filters?: Record<string, string[]>;
    filter_key?: string;
}

export interface PredictResponse {
    model: string;
    filter_key: string;
    predictions: number[];
    probabilities?: number[][];
}

export interface TrainOptions {
    filters?: Record<string, string[]>;
    hyperparams?: Record<string, unknown>;
    test_size?: number;
}

export interface TrainRequest {
    model: string;
    options?: TrainOptions;
}

export interface TrainResponse {
    model: string;
    filter_key: string;
    filters: Record<string, string[]>;
    trained: boolean;
    rows_used: number;
    metrics: Record<string, number>;
    artifact_uri?: string | null;
    message?: string | null;
}
