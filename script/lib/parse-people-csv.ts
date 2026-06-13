export interface CricsheetEspnEntry {
    cricsheetId: string;
    cricsheetName: string;
    espnId: string;
}

export function parsePeopleCsv(csv: string): CricsheetEspnEntry[] {
    const lines = csv.trim().split("\n");
    if (lines.length === 0) {
        throw new Error("Cricsheet register CSV is empty");
    }

    const header = lines[0].split(",");
    const cricsheetIdIndex = header.indexOf("identifier");
    const cricsheetNameIndex = header.indexOf("name");
    const espnIdIndex = header.indexOf("key_cricinfo");

    if (cricsheetIdIndex === -1 || cricsheetNameIndex === -1 || espnIdIndex === -1) {
        throw new Error("Cricsheet register CSV is missing required columns");
    }

    const entries: CricsheetEspnEntry[] = [];

    for (const line of lines.slice(1)) {
        if (!line.trim()) {
            continue;
        }

        const columns = line.split(",");
        const cricsheetId = columns[cricsheetIdIndex]?.trim();
        const cricsheetName = columns[cricsheetNameIndex]?.trim();
        const espnId = columns[espnIdIndex]?.trim();

        if (!cricsheetId || !espnId) {
            continue;
        }

        entries.push({
            cricsheetId,
            cricsheetName: cricsheetName ?? "",
            espnId,
        });
    }

    return entries;
}
