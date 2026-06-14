export function normalize(value: string): string {
    const parts = value.split(",")
    const mainPart = parts[0]?.trim().toLowerCase().replace(/[^a-z]/g, "");
    return mainPart ?? "";
}

export function optionalNormalizedField(value: string | null | undefined): string {
    return value ? normalize(value) : "";
}
