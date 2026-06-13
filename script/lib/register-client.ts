const PEOPLE_CSV_URL = "https://cricsheet.org/register/people.csv";

export interface RegisterDownloadResult {
    csv: string;
    lastModified: string | null;
}

export class RegisterClient {
    public async fetchPeopleCsv(): Promise<RegisterDownloadResult> {
        const response = await fetch(PEOPLE_CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to download Cricsheet register: ${response.status} ${response.statusText}`);
        }

        return {
            csv: await response.text(),
            lastModified: response.headers.get("last-modified"),
        };
    }

    public async fetchRemoteLastModified(): Promise<string | null> {
        const response = await fetch(PEOPLE_CSV_URL, { method: "HEAD" });
        if (!response.ok) {
            throw new Error(`Failed to check Cricsheet register freshness: ${response.status} ${response.statusText}`);
        }

        return response.headers.get("last-modified");
    }
}
