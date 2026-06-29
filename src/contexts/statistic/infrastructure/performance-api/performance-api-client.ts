import {
    CatalogueResponse,
    ComputeMatchStatisticsRequest,
    ComputeMatchStatisticsResponse,
    ComputePlayerRatingsRequest,
    ComputePlayerRatingsResponse,
} from "./types";

export class PerformanceApiClient {
    private readonly baseUrl: string;

    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
    }

    public async computeMatchStatistics(
        request: ComputeMatchStatisticsRequest,
    ): Promise<ComputeMatchStatisticsResponse> {
        return this.post<ComputeMatchStatisticsResponse>("/match/statistics:compute", request);
    }

    public async computePlayerRatings(
        request: ComputePlayerRatingsRequest,
    ): Promise<ComputePlayerRatingsResponse> {
        return this.post<ComputePlayerRatingsResponse>("/player/ratings:compute", request);
    }

    public async getCatalogue(): Promise<CatalogueResponse> {
        return this.get<CatalogueResponse>("/catalogue");
    }

    public async health(): Promise<{ status: string }> {
        return this.get<{ status: string }>("/health");
    }

    private async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`performance-api ${path} failed (${response.status}): ${text}`);
        }

        return response.json() as Promise<TResponse>;
    }

    private async get<TResponse>(path: string): Promise<TResponse> {
        const response = await fetch(`${this.baseUrl}${path}`, { method: "GET" });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`performance-api ${path} failed (${response.status}): ${text}`);
        }

        return response.json() as Promise<TResponse>;
    }
}
