export function normalize(value: string): string {
    return value.trim().toLowerCase();
}

export function optionalNormalizedField(value: string | null | undefined): string {
    return value ? normalize(value) : "";
}
