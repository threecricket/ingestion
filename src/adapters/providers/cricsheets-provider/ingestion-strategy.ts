import { EntityType } from "@/domain/identity/models/entity-type";
import { MatchIngestionStrategy, ProviderDependencies } from "@/domain/provider/models/provider";
import { Match, MatchFormat, MatchResult, ResultType } from "@/domain/match/models/match";
import { Inning } from "@/domain/match/models/innings";
import { Ball, BallResult, WicketType } from "@/domain/match/models/ball";
import { Team } from "@/domain/team/models/team";
import { Venue } from "@/domain/venue/models/venue";
import {
    createPlayerFromEnrichment,
    toMatchIdentityInput,
    toPlayerIdentityInputFromEnrichment,
    toTeamIdentityInput,
    toVenueIdentityInput,
} from "./identity-inputs";
import { CricsheetsClient } from "./client";
import { CricsheetPlayerEnrichmentLookup } from "./player-enrichment";

const FORMAT_MAP: Record<string, MatchFormat> = {
    "TEST": MatchFormat.TEST,
    "ODI": MatchFormat.ODI,
    "T20": MatchFormat.T20,
};

interface CricsheetsDelivery {
    actual_delivery: string;
    batter: string;
    bowler: string;
    non_striker: string;
    runs: {
        batter: number;
        extras: number;
        total: number;
    };
    extras?: {
        wides?: number;
        noballs?: number;
        legbyes?: number;
        byes?: number;
        penalty?: number;
    };
    wickets?: Array<{
        player_out: string;
        kind: string;
    }>;
}

interface CricsheetsInning {
    team: string;
    overs: Array<{
        over: number;
        deliveries: CricsheetsDelivery[];
    }>;
    target?: {
        overs: number;
        runs: number;
    };
}

interface CricsheetsMatchObject {
    info: {
        balls_per_over?: number;
        dates: string[];
        match_type: string;
        teams: string[];
        venue: string;
        outcome?: {
            winner?: string;
            result?: string;
        };
        players?: Record<string, string[]>;
        registry?: {
            people?: Record<string, string>;
        };
    };
    innings: CricsheetsInning[];
}

interface PlayerInningsStats {
    runs: number;
    balls: number;
}

interface BowlerInningsStats {
    runs: number;
    balls: number;
    wickets: number;
}

export class CricsheetsMatchIngestionStrategy implements MatchIngestionStrategy {
    private readonly dependencies;
    private readonly client: CricsheetsClient;
    private readonly playerEnrichment: CricsheetPlayerEnrichmentLookup;
    private unknownHomeVenue: Venue | null = null;

    public constructor(
        dependencies: ProviderDependencies,
        client: CricsheetsClient,
        playerEnrichment: CricsheetPlayerEnrichmentLookup,
    ) {
        this.dependencies = dependencies;
        this.client = client;
        this.playerEnrichment = playerEnrichment;
    }

    private getUnknownHomeVenue(): Venue {
        if (this.unknownHomeVenue) {
            return this.unknownHomeVenue;
        }

        const venueIdentityInput = toVenueIdentityInput("Unknown");

        this.unknownHomeVenue = this.dependencies.entityResolver.resolveOrCreate({
            canonicalIdentity: this.dependencies.identityHasherFactory.toCanonicalIdentity(
                EntityType.VENUE,
                venueIdentityInput,
            ),
            findEntity: (id) => this.dependencies.venueRepository.findById(id),
            saveEntity: (venue) => this.dependencies.venueRepository.save(venue),
            createEntity: (id) => Venue.create(id, "Unknown", "Unknown", "Unknown"),
        });

        return this.unknownHomeVenue;
    }

    private resolveVenue(venueName: string): Venue {
        const venueIdentityInput = toVenueIdentityInput(venueName);

        return this.dependencies.entityResolver.resolveOrCreate({
            canonicalIdentity: this.dependencies.identityHasherFactory.toCanonicalIdentity(
                EntityType.VENUE,
                venueIdentityInput,
            ),
            findEntity: (id) => this.dependencies.venueRepository.findById(id),
            saveEntity: (venue) => this.dependencies.venueRepository.save(venue),
            createEntity: (id) => Venue.create(id, venueName, "Unknown", "Unknown"),
        });
    }

    private resolveTeam(teamName: string): Team {
        const teamIdentityInput = toTeamIdentityInput(teamName);

        return this.dependencies.entityResolver.resolveOrCreate({
            canonicalIdentity: this.dependencies.identityHasherFactory.toCanonicalIdentity(
                EntityType.TEAM,
                teamIdentityInput,
            ),
            findEntity: (id) => this.dependencies.teamRepository.findById(id),
            saveEntity: (team) => this.dependencies.teamRepository.save(team),
            createEntity: (id) => Team.create(id, teamName, this.getUnknownHomeVenue()),
        });
    }

    private resolvePlayer(
        playerName: string,
        registry: Record<string, string>,
        playerInternalIdsByName: Map<string, string>,
    ): string {
        const cachedId = playerInternalIdsByName.get(playerName);
        if (cachedId) {
            return cachedId;
        }

        if (!registry[playerName]) {
            throw new Error(`Unknown player: ${playerName}`);
        }

        const registryHash = registry[playerName];
        const enriched = this.playerEnrichment.resolveByRegistryHash(registryHash);
        const playerIdentityInput = toPlayerIdentityInputFromEnrichment(enriched);

        const player = this.dependencies.entityResolver.resolveOrCreate({
            canonicalIdentity: this.dependencies.identityHasherFactory.toCanonicalIdentity(
                EntityType.PLAYER,
                playerIdentityInput,
            ),
            findEntity: (id) => this.dependencies.playerRepository.findById(id),
            saveEntity: (entity) => this.dependencies.playerRepository.save(entity),
            createEntity: (id) => createPlayerFromEnrichment(id, enriched),
        });

        const internalId = player.getPlayerId();
        playerInternalIdsByName.set(playerName, internalId);
        return internalId;
    }

    private registerPlayers(
        matchObject: CricsheetsMatchObject,
        playerInternalIdsByName: Map<string, string>,
    ): Record<string, string> {
        const registry = matchObject.info.registry?.people ?? {};
        const playersByTeam = matchObject.info.players ?? {};

        for (const playerNames of Object.values(playersByTeam)) {
            for (const playerName of playerNames) {
                this.resolvePlayer(playerName, registry, playerInternalIdsByName);
            }
        }

        return registry;
    }

    private buildMatchResult(
        outcome: CricsheetsMatchObject["info"]["outcome"],
        teamIdsByName: Record<string, string>,
    ): MatchResult {
        if (outcome?.winner) {
            const winnerTeamId = teamIdsByName[outcome.winner];
            if (!winnerTeamId) {
                throw new Error(`Unknown winning team: ${outcome.winner}`);
            }

            return MatchResult.create(ResultType.WON, winnerTeamId);
        }

        if (outcome?.result === "tie") {
            return MatchResult.create(ResultType.TIE, null);
        }

        if (outcome?.result === "no result") {
            return MatchResult.create(ResultType.NO_RESULT, null);
        }

        throw new Error("Match outcome is missing or unsupported");
    }

    private mapWicketType(kind: string): WicketType {
        switch (kind.toLowerCase()) {
            case "bowled":
            case "caught and bowled":
                return WicketType.BOWLED;
            case "caught":
                return WicketType.CAUGHT;
            case "lbw":
                return WicketType.LBW;
            case "stumped":
                return WicketType.STUMPED;
            case "run out":
                return WicketType.RUN_OUT;
            case "hit wicket":
                return WicketType.HIT_WICKET;
            case "obstructing the field":
                return WicketType.OBSTRUCTING;
            default:
                throw new Error(`Unsupported wicket kind: ${kind}`);
        }
    }

    private isBowlerWicket(kind: string): boolean {
        const normalized = kind.toLowerCase();
        return normalized !== "run out"
            && normalized !== "obstructing the field"
            && normalized !== "retired out";
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

    private buildInnings(
        matchObject: CricsheetsMatchObject,
        teamIdsByName: Record<string, string>,
        registry: Record<string, string>,
        playerInternalIdsByName: Map<string, string>,
    ): Inning[] {
        const ballsPerOver = matchObject.info.balls_per_over ?? 6;

        return matchObject.innings.map((inning, index) => {
            const battingTeamId = teamIdsByName[inning.team];
            const bowlingTeamName = matchObject.info.teams.find((team) => team !== inning.team);

            if (!battingTeamId || !bowlingTeamName) {
                throw new Error(`Unknown teams for inning ${index + 1}`);
            }

            const bowlingTeamId = teamIdsByName[bowlingTeamName];
            const batterStats = new Map<string, PlayerInningsStats>();
            const bowlerStats = new Map<string, BowlerInningsStats>();
            const ballList: Ball[] = [];

            let teamRuns = 0;
            let teamWickets = 0;
            let ballNumber = 0;
            let lastOver = 0;
            let lastBall = 0;

            for (const over of inning.overs) {
                for (const delivery of over.deliveries) {
                    ballNumber += 1;

                    const batterId = this.resolvePlayer(delivery.batter, registry, playerInternalIdsByName);
                    const bowlerId = this.resolvePlayer(delivery.bowler, registry, playerInternalIdsByName);
                    const nonStrikerId = this.resolvePlayer(delivery.non_striker, registry, playerInternalIdsByName);

                    const isWide = delivery.extras?.wides !== undefined;
                    const isNoBall = delivery.extras?.noballs !== undefined;
                    const isLegalDelivery = !isWide && !isNoBall;

                    teamRuns += delivery.runs.total;

                    const batter = this.getBatterStats(batterStats, batterId);
                    batter.runs += delivery.runs.batter;
                    if (!isWide) {
                        batter.balls += 1;
                    }

                    const bowler = this.getBowlerStats(bowlerStats, bowlerId);
                    bowler.runs += delivery.runs.total;
                    if (isLegalDelivery) {
                        bowler.balls += 1;
                    }

                    const nonStriker = this.getBatterStats(batterStats, nonStrikerId);

                    let playerOutId: string | null = null;
                    let wicketType: WicketType | null = null;
                    const wicket = delivery.wickets?.[0];
                    const isOut = Boolean(wicket);

                    if (wicket) {
                        playerOutId = this.resolvePlayer(wicket.player_out, registry, playerInternalIdsByName);
                        wicketType = this.mapWicketType(wicket.kind);
                        teamWickets += 1;

                        if (this.isBowlerWicket(wicket.kind)) {
                            bowler.wickets += 1;
                        }
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

                    const [overValue, ballValue] = delivery.actual_delivery.split(".").map(Number);
                    lastOver = overValue;
                    lastBall = ballValue;
                }
            }

            const { overs, balls } = this.parseDeliveryPosition(lastOver, lastBall, ballsPerOver);

            return Inning.create(
                index + 1,
                teamRuns,
                teamWickets,
                overs,
                balls,
                battingTeamId,
                bowlingTeamId,
                ballList,
                inning.target?.runs ?? null,
            );
        });
    }

    private buildMatchObject(matchObject: CricsheetsMatchObject): Match {
        const startDate = new Date(matchObject.info.dates[0]);
        const endDate = new Date(matchObject.info.dates[matchObject.info.dates.length - 1]);
        const format = FORMAT_MAP[matchObject.info.match_type];

        if (!format) {
            throw new Error(`Unsupported match type: ${matchObject.info.match_type}`);
        }

        if (matchObject.info.teams.length !== 2) {
            throw new Error(`Expected exactly 2 teams, found ${matchObject.info.teams.length}`);
        }

        const venue = this.resolveVenue(matchObject.info.venue);
        const [team1Name, team2Name] = matchObject.info.teams;
        const team1 = this.resolveTeam(team1Name);
        const team2 = this.resolveTeam(team2Name);

        const matchCanonicalIdentity = this.dependencies.identityHasherFactory.toCanonicalIdentity(
            EntityType.MATCH,
            toMatchIdentityInput(
                matchObject.info.dates[0],
                matchObject.info.match_type,
                team1.getTeamId(),
                team2.getTeamId(),
            ),
        );

        const existingMatch = this.dependencies.entityResolver.findByCanonicalIdentity({
            canonicalIdentity: matchCanonicalIdentity,
            findEntity: (id) => this.dependencies.matchRepository.findById(id),
        });
        if (existingMatch) {
            return existingMatch;
        }

        const teamIdsByName = {
            [team1Name]: team1.getTeamId(),
            [team2Name]: team2.getTeamId(),
        };

        const playerInternalIdsByName = new Map<string, string>();
        const registry = this.registerPlayers(matchObject, playerInternalIdsByName);
        const innings = this.buildInnings(
            matchObject,
            teamIdsByName,
            registry,
            playerInternalIdsByName,
        );

        return this.dependencies.entityResolver.resolveOrCreate({
            canonicalIdentity: matchCanonicalIdentity,
            findEntity: (id) => this.dependencies.matchRepository.findById(id),
            saveEntity: (match) => this.dependencies.matchRepository.save(match),
            createEntity: (id) => Match.create(
                id,
                venue.getVenueId(),
                team1.getTeamId(),
                team2.getTeamId(),
                startDate,
                endDate,
                this.buildMatchResult(matchObject.info.outcome, teamIdsByName),
                format,
                innings,
            ),
        });
    }

    public async getMatches(): Promise<Match[]> {
        const matchObjects = await this.client.getMatchObjects();
        const matches = await Promise.all(matchObjects.map(async (matchKey) => {
            const matchObject = await this.client.getMatch(matchKey);
            return this.buildMatchObject(matchObject);
        }));

        return matches;
    }
}
