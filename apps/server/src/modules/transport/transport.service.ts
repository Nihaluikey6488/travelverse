import { Injectable } from "@nestjs/common";
import type {
  TransportComparisonOption,
  TransportComparisonRecommendation,
  TransportComparisonRequest,
  TransportComparisonResponse,
} from "@travelverse/contracts";
import { resolveTravelDistance } from "./transport-distance";
import { TransportCostEngine } from "./transport-cost-engine";
import {
  EstimatedBusProvider,
  EstimatedDrivingProvider,
  EstimatedRailProvider,
  SandboxFlightProvider,
} from "./transport-quote.providers";
import type { TransportQuoteContext, TransportQuoteProvider } from "./transport-provider.interface";

@Injectable()
export class TransportService {
  private readonly providers: TransportQuoteProvider[];

  constructor(
    private readonly sandboxFlightProvider: SandboxFlightProvider,
    private readonly estimatedRailProvider: EstimatedRailProvider,
    private readonly estimatedBusProvider: EstimatedBusProvider,
    private readonly estimatedDrivingProvider: EstimatedDrivingProvider,
    private readonly transportCostEngine: TransportCostEngine,
  ) {
    this.providers = [
      this.sandboxFlightProvider,
      this.estimatedRailProvider,
      this.estimatedBusProvider,
      this.estimatedDrivingProvider,
    ];
  }

  async compare(request: TransportComparisonRequest): Promise<TransportComparisonResponse> {
    const fetchedAt = new Date().toISOString();
    const distance = resolveTravelDistance(request.origin, request.destination);
    const context: TransportQuoteContext = {
      distance,
      fetchedAt,
      travellerCount: request.travellers.adults + request.travellers.children,
    };
    const options = await Promise.all(
      this.providers.map((provider) => provider.quote(request, context)),
    );
    const recommendations = createRecommendations(options);
    const recommendedOption =
      options.find((option) => option.id === recommendations.recommendedOptionId) ?? options[0];
    const tripCost = this.transportCostEngine.calculate(request, recommendedOption);

    return {
      costBreakdown: tripCost.costBreakdown,
      currency: request.currency,
      fetchedAt,
      options,
      providers: this.providers.map((provider) => provider.contract),
      recommendations,
      request,
      totals: tripCost.totals,
      warnings: [
        ...distance.warnings,
        "Values marked SANDBOX or ESTIMATED are planning aids, not confirmed booking prices.",
      ],
    };
  }
}

function createRecommendations(
  options: TransportComparisonOption[],
): TransportComparisonRecommendation {
  const cheapest = minBy(options, (option) => option.totalPriceInr);
  const fastest = minBy(options, (option) => option.durationMinutes);
  const highestCost = Math.max(...options.map((option) => option.totalPriceInr));
  const slowestDuration = Math.max(...options.map((option) => option.durationMinutes));
  const recommended = minBy(options, (option) => {
    const costScore = option.totalPriceInr / highestCost;
    const durationScore = option.durationMinutes / slowestDuration;
    const confidencePenalty =
      option.confidence === "HIGH" ? 0 : option.confidence === "MEDIUM" ? 0.08 : 0.16;
    const sourcePenalty = option.source === "SANDBOX" ? 0.03 : option.source === "LIVE" ? 0 : 0.08;

    return costScore * 0.48 + durationScore * 0.36 + confidencePenalty + sourcePenalty;
  });

  return {
    cheapestOptionId: cheapest.id,
    fastestOptionId: fastest.id,
    recommendedOptionId: recommended.id,
  };
}

function minBy<TItem>(items: TItem[], selector: (item: TItem) => number): TItem {
  return items.reduce((best, item) => (selector(item) < selector(best) ? item : best));
}
