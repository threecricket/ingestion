export interface IdentityHasher<TInput> {
    hash(input: TInput): string;
}
