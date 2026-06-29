export enum RatingKind {
    SUB = "sub",
    OVERALL = "overall",
}

export class PlayerRatingType {
    private name: string;
    private displayName: string;
    private description: string;
    private kind: RatingKind;

    private constructor(name: string, displayName: string, description: string, kind: RatingKind) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.kind = kind;
    }

    public static create(
        name: string,
        displayName: string,
        description: string,
        kind: RatingKind,
    ): PlayerRatingType {
        return new PlayerRatingType(name, displayName, description, kind);
    }

    public getName(): string {
        return this.name;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getDescription(): string {
        return this.description;
    }

    public getKind(): RatingKind {
        return this.kind;
    }
}

export class PlayerRating {
    private playerId: string;
    private ratingName: string;
    private value: number;
    private normsVersion: string | null;

    private constructor(
        playerId: string,
        ratingName: string,
        value: number,
        normsVersion: string | null,
    ) {
        this.playerId = playerId;
        this.ratingName = ratingName;
        this.value = value;
        this.normsVersion = normsVersion;
    }

    public static create(
        playerId: string,
        ratingName: string,
        value: number,
        normsVersion: string | null = null,
    ): PlayerRating {
        return new PlayerRating(playerId, ratingName, value, normsVersion);
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public getRatingName(): string {
        return this.ratingName;
    }

    public getValue(): number {
        return this.value;
    }

    public getNormsVersion(): string | null {
        return this.normsVersion;
    }
}
