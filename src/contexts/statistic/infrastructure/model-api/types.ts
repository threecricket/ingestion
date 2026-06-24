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
