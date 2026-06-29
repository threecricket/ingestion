export const MIN_START_DATE_ENV = "INGESTION_MIN_START_DATE";

function startOfLastYear(now: Date = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
}

export function resolveMinStartDate(env: NodeJS.ProcessEnv = process.env): Date {
    const raw = env[MIN_START_DATE_ENV]?.trim();

    if (!raw) {
        return startOfLastYear();
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) {
        throw new Error(
            `Invalid ${MIN_START_DATE_ENV} value "${raw}" (expected YYYY-MM-DD).`,
        );
    }

    const [, year, month, day] = match;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (Number.isNaN(parsed.getTime())) {
        throw new Error(
            `Invalid ${MIN_START_DATE_ENV} value "${raw}" (expected YYYY-MM-DD).`,
        );
    }

    return parsed;
}
