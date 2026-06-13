import { normalize, optionalNormalizedField } from "@/domain/identity/hashing/normalize";
import { IdentityHasher } from "@/domain/identity/hashing/identity-hasher";
import { VenueIdentityInput } from "@/domain/identity/hashing/inputs/venue-identity-input";

export class VenueIdentityHasher implements IdentityHasher<VenueIdentityInput> {
    public hash(input: VenueIdentityInput): string {
        return [
            "venue",
            normalize(input.venueName),
            optionalNormalizedField(input.city),
            optionalNormalizedField(input.country),
        ].join(":");
    }
}
