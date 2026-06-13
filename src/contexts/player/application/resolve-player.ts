import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { Player } from "@/contexts/player/domain/models/player";
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";
import { PlayerIdentityInput } from "@/contexts/player/identity/player-identity-input";

export interface ResolvePlayerParams {
    identityInput: PlayerIdentityInput;
    createPlayer: (id: string) => Player;
}

export class ResolvePlayerUseCase {
    public constructor(
        private readonly entityResolver: EntityResolver,
        private readonly identityHasherFactory: IdentityHasherFactory,
        private readonly playerRepository: PlayerRepository,
    ) {}

    public async execute(params: ResolvePlayerParams): Promise<Player> {
        return this.entityResolver.resolveOrCreate({
            canonicalIdentity: this.identityHasherFactory.toCanonicalIdentity(
                EntityType.PLAYER,
                params.identityInput,
            ),
            findEntity: (id) => this.playerRepository.findById(id),
            saveEntity: (player) => this.playerRepository.save(player),
            createEntity: params.createPlayer,
        });
    }

    public async resolveByName(
        playerName: string,
        registry: Record<string, string>,
        playerInternalIdsByName: Map<string, string>,
        resolveParams: (registryHash: string) => ResolvePlayerParams,
    ): Promise<string> {
        const cachedId = playerInternalIdsByName.get(playerName);
        if (cachedId) {
            return cachedId;
        }

        if (!registry[playerName]) {
            throw new Error(`Unknown player: ${playerName}`);
        }

        const player = await this.execute(resolveParams(registry[playerName]));
        const internalId = player.getPlayerId();
        playerInternalIdsByName.set(playerName, internalId);
        return internalId;
    }
}
