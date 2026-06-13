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
    private playerName: string;
    private battingHand?: Handedness;
    private bowlingHand?: Handedness;
    private bowlingStyle?: BowlingStyle;
    private roles?: Role[];
    private country?: string;
    private birthDate?: Date;

    private constructor(
        playerId: string, 
        playerName: string, 
        battingHand?: Handedness, 
        bowlingHand?: Handedness, 
        bowlingStyle?: BowlingStyle, 
        roles?: Role[], 
        country?: string, 
        birthDate?: Date) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.battingHand = battingHand;
        this.bowlingHand = bowlingHand;
        this.bowlingStyle = bowlingStyle;
        this.roles = roles ?? [];
        this.country = country;
        this.birthDate = birthDate;
    }

    public static create(
        playerId: string, 
        playerName: string, 
        battingHand?: Handedness, 
        bowlingHand?: Handedness, 
        bowlingStyle?: BowlingStyle, 
        roles?: Role[], 
        country?: string, 
        birthDate?: Date): Player {
        if (!playerId || !playerName) {
            throw new Error("Invalid player data");
        }
        return new Player(playerId, playerName, battingHand, bowlingHand, bowlingStyle, roles, country, birthDate);
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public getPlayerName(): string {
        return this.playerName;
    }
    
    public getBattingHand(): Handedness | undefined {
        return this.battingHand;
    }

    public getBowlingHand(): Handedness | undefined {
        return this.bowlingHand;
    }
    
    public getBowlingStyle(): BowlingStyle | undefined {
        return this.bowlingStyle;
    }

    public getRoles(): Role[] | undefined {
        return this.roles;
    }
    
    public getCountry(): string | undefined {
        return this.country;
    }

    public getBirthDate(): Date | undefined {
        return this.birthDate;
    }

    public getAge(): number | undefined {
        if (!this.birthDate) {
            return undefined;
        }
        return new Date().getFullYear() - this.birthDate.getFullYear();
    }
}