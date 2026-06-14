import { EntityType } from "@/shared/identity/domain/models/entity-type";
import { EntityResolver } from "@/shared/identity/domain/services/entity-resolver";
import { IdentityHasherFactory } from "@/shared/identity/domain/hashing/identity-hasher-factory";
import { ResolvePlayerUseCase } from "@/contexts/player/application/resolve-player";
import { ResolveTeamUseCase } from "@/contexts/team/application/resolve-team";
import { ResolveVenueUseCase } from "@/contexts/venue/application/resolve-venue";
import { Ball, BallResult } from "@/contexts/match/domain/models/ball";
import { Inning } from "@/contexts/match/domain/models/innings";
import { Match } from "@/contexts/match/domain/models/match";
import { MatchRepository } from "@/contexts/match/domain/repositories/match-repository";
import { MatchIdentityInput } from "@/contexts/match/identity/match-identity-input";
import { IngestMatchCommand } from "@/contexts/match/application/ingest-match-command";

interface PlayerInningsStats {
    runs: number;
    balls: number;
}

interface BowlerInningsStats {
    runs: number;
    balls: number;
    wickets: number;
}

export class IngestMatchUseCase {
    public constructor(
        private readonly entityResolver: EntityResolver,
        private readonly identityHasherFactory: IdentityHasherFactory,
        private readonly matchRepository: MatchRepository,
        private readonly resolveVenue: ResolveVenueUseCase,
        private readonly resolveTeam: ResolveTeamUseCase,
        private readonly resolvePlayer: ResolvePlayerUseCase,
    ) {}

    public async execute(command: IngestMatchCommand): Promise<Match> {
        if (command.teamNames.length !== 2) {
            throw new Error(`Expected exactly 2 teams, found ${command.teamNames.length}`);
        }

        const venue = await this.resolveVenue.execute({ venueName: command.venueName });
        const [team1Name, team2Name] = command.teamNames;
        const team1 = await this.resolveTeam.execute({ teamName: team1Name });
        const team2 = await this.resolveTeam.execute({ teamName: team2Name });

        const matchIdentityInput: MatchIdentityInput = {
            matchDate: command.matchDate,
            format: command.matchType,
            team1Id: team1.getTeamId(),
            team2Id: team2.getTeamId(),
        };

        const matchCanonicalIdentity = this.identityHasherFactory.toCanonicalIdentity(
            EntityType.MATCH,
            matchIdentityInput,
        );

        const existingMatch = await this.entityResolver.findByCanonicalIdentity({
            canonicalIdentity: matchCanonicalIdentity,
            findEntity: (id) => this.matchRepository.findById(id),
        });
        if (existingMatch) {
            return existingMatch;
        }

        const teamIdsByName = {
            [team1Name]: team1.getTeamId(),
            [team2Name]: team2.getTeamId(),
        };

        const playerInternalIdsByName = new Map<string, string>();
        const registry = await this.registerSquadPlayers(command, playerInternalIdsByName);
        const innings = await this.buildInnings(command, teamIdsByName, registry, playerInternalIdsByName);

        return this.entityResolver.resolveOrCreate({
            canonicalIdentity: matchCanonicalIdentity,
            findEntity: (id) => this.matchRepository.findById(id),
            saveEntity: (match) => this.matchRepository.save(match),
            createEntity: (id) => Match.create(
                id,
                venue.getVenueId(),
                team1.getTeamId(),
                team2.getTeamId(),
                command.startDate,
                command.endDate,
                command.buildMatchResult(teamIdsByName),
                command.format,
                innings,
            ),
        });
    }

    private async registerSquadPlayers(
        command: IngestMatchCommand,
        playerInternalIdsByName: Map<string, string>,
    ): Promise<Record<string, string>> {
        for (const playerName of command.squadPlayerNames) {
            await this.resolvePlayer.resolveByName(
                playerName,
                command.playerRegistry,
                playerInternalIdsByName,
                (registryHash) => command.resolvePlayerParams(registryHash),
            );
        }

        return command.playerRegistry;
    }

    private async buildInnings(
        command: IngestMatchCommand,
        teamIdsByName: Record<string, string>,
        registry: Record<string, string>,
        playerInternalIdsByName: Map<string, string>,
    ): Promise<Inning[]> {
        const innings: Inning[] = [];

        for (const [index, inning] of command.innings.entries()) {
            const battingTeamId = teamIdsByName[inning.battingTeamName];
            const bowlingTeamName = command.teamNames.find((team) => team !== inning.battingTeamName);

            if (!battingTeamId || !bowlingTeamName) {
                throw new Error(`Unknown teams for inning ${index + 1}`);
            }

            const bowlingTeamId = teamIdsByName[bowlingTeamName];
            const batterStats = new Map<string, PlayerInningsStats>();
            const bowlerStats = new Map<string, BowlerInningsStats>();
            const ballList: Ball[] = [];

            let teamRuns = 0;
            let teamWickets = 0;
            let ballNumber = 1;
            let lastOver = 0;
            let lastBall = 0;

            for (const delivery of inning.deliveries) {
                const batterId = await this.resolvePlayerByName(
                    delivery.batterName,
                    registry,
                    playerInternalIdsByName,
                    command,
                );
                const bowlerId = await this.resolvePlayerByName(
                    delivery.bowlerName,
                    registry,
                    playerInternalIdsByName,
                    command,
                );
                const nonStrikerId = await this.resolvePlayerByName(
                    delivery.nonStrikerName,
                    registry,
                    playerInternalIdsByName,
                    command,
                );

                const isWide = delivery.extras?.wides !== undefined;
                const isNoBall = delivery.extras?.noballs !== undefined;
                const isLegalDelivery = !isWide && !isNoBall;

                const batter = this.getBatterStats(batterStats, batterId);
                const bowler = this.getBowlerStats(bowlerStats, bowlerId);
                const nonStriker = this.getBatterStats(batterStats, nonStrikerId);

                let playerOutId: string | null = null;
                let wicketType = null;
                const wicket = delivery.wicket;
                const isOut = Boolean(wicket);

                if (wicket) {
                    playerOutId = await this.resolvePlayerByName(
                        wicket.playerOutName,
                        registry,
                        playerInternalIdsByName,
                        command,
                    );
                    wicketType = command.mapWicketType(wicket.kind);
                }

                const ballResult = BallResult.create(
                    delivery.runs.batter,
                    isOut,
                    delivery.runs.extras,
                    isWide,
                    isNoBall,
                    playerOutId,
                    wicketType,
                );

                ballList.push(Ball.create(
                    ballNumber,
                    teamRuns,
                    teamWickets,
                    batterId,
                    batter.runs,
                    batter.balls,
                    bowlerId,
                    bowler.runs,
                    bowler.balls,
                    bowler.wickets,
                    nonStrikerId,
                    nonStriker.runs,
                    nonStriker.balls,
                    ballResult,
                ));

                teamRuns += delivery.runs.total;
                batter.runs += delivery.runs.batter;
                if (isLegalDelivery) {
                    batter.balls += 1;
                }

                bowler.runs += delivery.runs.total;
                bowler.balls += 1;

                if (wicket) {
                    teamWickets += 1;

                    if (command.isBowlerWicket(wicket.kind)) {
                        bowler.wickets += 1;
                    }
                }

                const [overValue, ballValue] = delivery.actualDelivery.split(".").map(Number);
                lastOver = overValue;
                lastBall = ballValue;

                ballNumber += isLegalDelivery ? 1 : 0;
            }

            const { overs, balls } = this.parseDeliveryPosition(lastOver, lastBall, command.ballsPerOver);

            innings.push(Inning.create(
                index + 1,
                teamRuns,
                teamWickets,
                overs,
                balls,
                battingTeamId,
                bowlingTeamId,
                ballList,
                inning.target ?? null,
            ));
        }

        return innings;
    }

    private async resolvePlayerByName(
        playerName: string,
        registry: Record<string, string>,
        playerInternalIdsByName: Map<string, string>,
        command: IngestMatchCommand,
    ): Promise<string> {
        return this.resolvePlayer.resolveByName(
            playerName,
            registry,
            playerInternalIdsByName,
            (registryHash) => command.resolvePlayerParams(registryHash),
        );
    }

    private parseDeliveryPosition(
        over: number,
        ball: number,
        ballsPerOver: number,
    ): { overs: number; balls: number } {
        if (ball >= ballsPerOver) {
            return { overs: over + 1, balls: 0 };
        }

        return { overs: over, balls: ball };
    }

    private getBatterStats(
        stats: Map<string, PlayerInningsStats>,
        playerId: string,
    ): PlayerInningsStats {
        const existingStats = stats.get(playerId);
        if (existingStats) {
            return existingStats;
        }

        const newStats = { runs: 0, balls: 0 };
        stats.set(playerId, newStats);
        return newStats;
    }

    private getBowlerStats(
        stats: Map<string, BowlerInningsStats>,
        playerId: string,
    ): BowlerInningsStats {
        const existingStats = stats.get(playerId);
        if (existingStats) {
            return existingStats;
        }

        const newStats = { runs: 0, balls: 0, wickets: 0 };
        stats.set(playerId, newStats);
        return newStats;
    }
}
