import type {
  TransportComparisonRequest,
  TransportComparisonResponse,
} from "@travelverse/contracts";
import { apiRequest } from "@/lib/api";

export function compareTransport(payload: TransportComparisonRequest) {
  return apiRequest<TransportComparisonResponse>("/transport/compare", {
    body: payload,
    method: "POST",
  });
}
