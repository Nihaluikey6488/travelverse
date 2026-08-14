import type {
  TransportComparisonOption,
  TransportComparisonRequest,
  TransportProviderContract,
} from "@travelverse/contracts";
import type { ResolvedTravelDistance } from "./transport-distance";

export type TransportQuoteContext = {
  distance: ResolvedTravelDistance;
  fetchedAt: string;
  travellerCount: number;
};

export interface TransportQuoteProvider {
  readonly contract: TransportProviderContract;

  quote(
    request: TransportComparisonRequest,
    context: TransportQuoteContext,
  ): Promise<TransportComparisonOption> | TransportComparisonOption;
}
