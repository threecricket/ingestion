enum Role {
    BATTER = "batter",
    BOWLER = "bowler",
}

enum BowlingStyle {
    FAST = "fast",
    MEDIUM = "medium",
    SPIN = "spin",
    OFF_SPIN = "off-spin",
    LEG_SPIN = "leg-spin",
}

enum Handedness {
    RIGHT_HAND = "right-hand",
    LEFT_HAND = "left-hand",
}

export class Player {
    private playerId: string;
    private playerFirstName: string;
    private playerLastName: string;
    private playerFullName: string;
    private playerCommonName: string | null = null;
    private battingHand: Handedness | null = null;
    private bowlingHand: Handedness | null = null;
    private bowlingStyle: BowlingStyle | null = null;
    private roles: Role[] | null = null;
    private country: string | null = null;
    private birthDate: Date | null = null;

    private constructor(
        playerId: string,
        playerFirstName: string,
        playerLastName: string,
        playerFullName: string,
        playerCommonName: string | null = null,
        battingHand: Handedness | null = null,
        bowlingHand: Handedness | null = null,
        bowlingStyle: BowlingStyle | null = null,
        roles: Role[] | null = null,
        country: string | null = null,
        birthDate: Date | null = null,
    ) {
        this.playerId = playerId;
        this.playerFirstName = playerFirstName;
        this.playerLastName = playerLastName;
        this.playerFullName = playerFullName;
        this.playerCommonName = playerCommonName;
        this.battingHand = battingHand;
        this.bowlingHand = bowlingHand;
        this.bowlingStyle = bowlingStyle;
        this.roles = roles;
        this.country = country;
        this.birthDate = birthDate;
    }

    public static create(
        playerId: string,
        playerFirstName: string,
        playerLastName: string,
        playerFullName: string,
        playerCommonName: string | null = null,
        battingHand: Handedness | null = null,
        bowlingHand: Handedness | null = null,
        bowlingStyle: BowlingStyle | null = null,
        roles: Role[] | null = null,
        country: string | null = null,
        birthDate: Date | null = null,
    ): Player {
        if (!playerId || !playerFirstName || !playerLastName || !playerFullName) {
            throw new Error("Invalid player data");
        }
        return new Player(
            playerId,
            playerFirstName,
            playerLastName,
            playerFullName,
            playerCommonName,
            battingHand,
            bowlingHand,
            bowlingStyle,
            roles,
            country,
            birthDate,
        );
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public getPlayerFirstName(): string {
        return this.playerFirstName;
    }

    public getPlayerLastName(): string {
        return this.playerLastName;
    }

    public getPlayerFullName(): string {
        return this.playerFullName;
    }

    public getPlayerCommonName(): string | null {
        return this.playerCommonName;
    }

    public getBattingHand(): Handedness | null {
        return this.battingHand;
    }

    public getBowlingHand(): Handedness | null {
        return this.bowlingHand;
    }

    public getBowlingStyle(): BowlingStyle | null {
        return this.bowlingStyle;
    }

    public getRoles(): Role[] | null {
        return this.roles;
    }

    public getCountry(): string | null {
        return this.country;
    }

    public getBirthDate(): Date | null {
        return this.birthDate;
    }

    public getAge(): number | null {
        if (this.birthDate === null) {
            return null;
        }
        return new Date().getFullYear() - this.birthDate.getFullYear();
    }
}
