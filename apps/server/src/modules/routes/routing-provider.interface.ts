import type { RouteEstimateRequest, RouteEstimateResponse } from "@travelverse/contracts";

export interface RoutingProvider {
  estimate(request: RouteEstimateRequest): Promise<RouteEstimateResponse>;
}
