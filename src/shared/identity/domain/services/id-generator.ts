export interface IdGenerator {
    generate(fingerprint: string): string;
}
