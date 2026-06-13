import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { ResolveVenueUseCase } from "@/contexts/venue/application/resolve-venue";
import { Team } from "@/contexts/team/domain/models/team";
import { TeamRepository } from "@/contexts/team/domain/repositories/team-repository";
import { TeamIdentityInput } from "@/contexts/team/identity/team-identity-input";

export class ResolveTeamUseCase {
    public constructor(
        private readonly entityResolver: EntityResolver,
        private readonly identityHasherFactory: IdentityHasherFactory,
        private readonly teamRepository: TeamRepository,
        private readonly resolveVenue: ResolveVenueUseCase,
    ) {}

    public async execute(input: TeamIdentityInput): Promise<Team> {
        const homeVenue = await this.resolveVenue.resolveUnknownHomeVenue();

        return this.entityResolver.resolveOrCreate({
            canonicalIdentity: this.identityHasherFactory.toCanonicalIdentity(EntityType.TEAM, input),
            findEntity: (id) => this.teamRepository.findById(id),
            saveEntity: (team) => this.teamRepository.save(team),
            createEntity: (id) => Team.create(id, input.teamName, homeVenue),
        });
    }
}
