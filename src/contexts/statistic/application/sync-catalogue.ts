import { PerformanceGateway } from "@/contexts/statistic/domain/ports/performance-gateway";
import { MatchStatisticTypeRepository } from "@/contexts/statistic/domain/repositories/match-statistic-type-repository";
import { PlayerRatingTypeRepository } from "@/contexts/statistic/domain/repositories/player-rating-type-repository";

export class SyncCatalogueUseCase {
    public constructor(
        private readonly performanceGateway: PerformanceGateway,
        private readonly matchStatisticTypeRepository: MatchStatisticTypeRepository,
        private readonly playerRatingTypeRepository: PlayerRatingTypeRepository,
    ) {}

    public async execute(): Promise<{ matchStatisticTypes: number; playerRatingTypes: number }> {
        const catalogue = await this.performanceGateway.getCatalogue();

        for (const type of catalogue.matchStatisticTypes) {
            await this.matchStatisticTypeRepository.save(type);
        }

        for (const type of catalogue.playerRatingTypes) {
            await this.playerRatingTypeRepository.save(type);
        }

        return {
            matchStatisticTypes: catalogue.matchStatisticTypes.length,
            playerRatingTypes: catalogue.playerRatingTypes.length,
        };
    }
}
