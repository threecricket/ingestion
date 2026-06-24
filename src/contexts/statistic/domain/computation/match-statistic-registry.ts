import { MatchStatisticType } from "../models/match-statistic";
import { MatchStatisticComputer } from "./match-statistic-computer";

export class MatchStatisticComputerRegistry {
    private readonly computers = new Map<string, MatchStatisticComputer>();

    public register(computer: MatchStatisticComputer): void {
        const typeName = computer.getType().getName();
        if (this.computers.has(typeName)) {
            throw new Error(`Match statistic computer already registered for type: ${typeName}`);
        }
        this.computers.set(typeName, computer);
    }

    public get(typeName: string): MatchStatisticComputer | undefined {
        return this.computers.get(typeName);
    }

    public getAll(): MatchStatisticComputer[] {
        return [...this.computers.values()];
    }

    public getAllTypes(): MatchStatisticType[] {
        return this.getAll().map((computer) => computer.getType());
    }
}
