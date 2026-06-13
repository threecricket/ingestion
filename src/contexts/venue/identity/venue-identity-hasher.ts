import { normalize, optionalNormalizedField } from "@/shared/identity/domain/hashing/normalize";
import { IdentityHasher } from "@/shared/identity/domain/hashing/identity-hasher";
import { VenueIdentityInput } from "@/contexts/venue/identity/venue-identity-input";

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
