export function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function optionalField(value: string | null | undefined): string {
    if (!value) {
        return "_";
    }

    return normalize(value);
}

export function optionalNormalizedField(value: string | null | undefined): string {
    return optionalField(value);
}
