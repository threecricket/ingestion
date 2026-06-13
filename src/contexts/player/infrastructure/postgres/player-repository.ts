import { eq } from "drizzle-orm";
import { BowlingStyle, Handedness, Player, Role } from "@/contexts/player/domain/models/player";
import { PlayerRepository } from "@/contexts/player/domain/repositories/player-repository";
import { Database } from "@/shared/persistence/postgres/client";
import { players } from "@/contexts/player/infrastructure/postgres/schema";

type PlayerRow = typeof players.$inferSelect;

export class PostgresPlayerRepository implements PlayerRepository {
    public constructor(private readonly db: Database) {}

    public async findById(playerId: string): Promise<Player | null> {
        const rows = await this.db
            .select()
            .from(players)
            .where(eq(players.id, playerId))
            .limit(1);

        const row = rows[0];
        return row ? this.toPlayer(row) : null;
    }

    public async save(player: Player): Promise<void> {
        const row = this.fromPlayer(player);
        await this.db
            .insert(players)
            .values(row)
            .onConflictDoUpdate({
                target: players.id,
                set: {
                    firstName: row.firstName,
                    lastName: row.lastName,
                    fullName: row.fullName,
                    commonName: row.commonName,
                    battingHand: row.battingHand,
                    bowlingHand: row.bowlingHand,
                    bowlingStyle: row.bowlingStyle,
                    roles: row.roles,
                    country: row.country,
                    birthDate: row.birthDate,
                },
            });
    }

    private toPlayer(row: PlayerRow): Player {
        return Player.create(
            row.id,
            row.firstName,
            row.lastName,
            row.fullName,
            row.commonName,
            row.battingHand as Handedness | null,
            row.bowlingHand as Handedness | null,
            row.bowlingStyle as BowlingStyle | null,
            row.roles as Role[] | null,
            row.country,
            row.birthDate ? new Date(row.birthDate) : null,
        );
    }

    private fromPlayer(player: Player) {
        const birthDate = player.getBirthDate();
        return {
            id: player.getPlayerId(),
            firstName: player.getPlayerFirstName(),
            lastName: player.getPlayerLastName(),
            fullName: player.getPlayerFullName(),
            commonName: player.getPlayerCommonName(),
            battingHand: player.getBattingHand(),
            bowlingHand: player.getBowlingHand(),
            bowlingStyle: player.getBowlingStyle(),
            roles: player.getRoles(),
            country: player.getCountry(),
            birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : null,
        };
    }
}
