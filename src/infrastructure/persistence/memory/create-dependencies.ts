import { EntityResolver } from "@/domain/identity/services/entity-resolver";
import { IdentityHasherFactory } from "@/domain/identity/hashing/identity-hasher-factory";
import { Match } from "@/domain/match/models/match";
import { Player } from "@/domain/player/models/player";
import { ProviderDependencies } from "@/domain/provider/models/provider";
import { Team } from "@/domain/team/models/team";
import { Venue } from "@/domain/venue/models/venue";
import { UuidIdGenerator } from "@/infrastructure/identity/uuid-id-generator";
import { InMemoryCanonicalMappingRepository } from "@/infrastructure/persistence/memory/canonical-mapping-repository";

export function createMemoryDependencies(): {
    dependencies: ProviderDependencies;
    counts: () => { players: number; teams: number; venues: number; matches: number };
} {
    const players = new Map<string, Player>();
    const teams = new Map<string, Team>();
    const venues = new Map<string, Venue>();
    const matches = new Map<string, Match>();
    const canonicalMappingRepository = new InMemoryCanonicalMappingRepository();
    const idGenerator = new UuidIdGenerator();
    const entityResolver = new EntityResolver(canonicalMappingRepository, idGenerator);
    const identityHasherFactory = new IdentityHasherFactory();

    return {
        dependencies: {
            entityResolver,
            identityHasherFactory,
            playerRepository: {
                findById: async (id) => players.get(id) ?? null,
                save: async (player) => { players.set(player.getPlayerId(), player); },
            },
            teamRepository: {
                findById: async (id) => teams.get(id) ?? null,
                save: async (team) => { teams.set(team.getTeamId(), team); },
            },
            venueRepository: {
                findById: async (id) => venues.get(id) ?? null,
                save: async (venue) => { venues.set(venue.getVenueId(), venue); },
            },
            matchRepository: {
                findById: async (id) => matches.get(id) ?? null,
                save: async (match) => { matches.set(match.getMatchId(), match); },
            },
        },
        counts: () => ({
            players: players.size,
            teams: teams.size,
            venues: venues.size,
            matches: matches.size,
        }),
    };
}
