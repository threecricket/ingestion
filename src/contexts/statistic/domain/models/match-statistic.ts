import { EntityType } from "@/shared/identity/domain/models/entity-type";

export class MatchStatisticType {
    private name: string;
    private displayName: string;
    private description: string;
    private targetEntityType: EntityType;

    private constructor(
        name: string,
        displayName: string,
        description: string,
        targetEntityType: EntityType,
    ) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.targetEntityType = targetEntityType;
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

    public getTargetEntityType(): EntityType {
        return this.targetEntityType;
    }

    public static create(
        name: string,
        displayName: string,
        description: string,
        targetEntityType: EntityType,
    ): MatchStatisticType {
        return new MatchStatisticType(name, displayName, description, targetEntityType);
    }
}

export class MatchStatistic {
    private matchId: string;
    private statisticTypeName: string;
    private entityType: EntityType;
    private entityId: string;
    private value: number;

    private constructor(
        matchId: string,
        statisticTypeName: string,
        entityType: EntityType,
        entityId: string,
        value: number,
    ) {
        this.matchId = matchId;
        this.statisticTypeName = statisticTypeName;
        this.entityType = entityType;
        this.entityId = entityId;
        this.value = value;
    }

    public static create(
        matchId: string,
        statisticTypeName: string,
        entityType: EntityType,
        entityId: string,
        value: number,
    ): MatchStatistic {
        return new MatchStatistic(matchId, statisticTypeName, entityType, entityId, value);
    }

    public getMatchId(): string {
        return this.matchId;
    }

    public getStatisticTypeName(): string {
        return this.statisticTypeName;
    }

    public getEntityType(): EntityType {
        return this.entityType;
    }

    public getEntityId(): string {
        return this.entityId;
    }

    public getValue(): number {
        return this.value;
    }
}
