import type {
  Destination,
  DestinationListResponse,
  UpdateDestinationRequest,
  UpsertDestinationRequest,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function listAdminDestinations(status?: Destination["status"]) {
  const query = new URLSearchParams({
    limit: "50",
    page: "1",
  });

  if (status) {
    query.set("status", status);
  }

  return apiGet<DestinationListResponse>(`/admin/destinations?${query.toString()}`);
}

export function createDestination(payload: UpsertDestinationRequest) {
  return apiRequest<Destination>("/admin/destinations", {
    body: payload,
    method: "POST",
  });
}

export function updateDestination(slug: string, payload: UpdateDestinationRequest) {
  return apiRequest<Destination>(`/admin/destinations/${slug}`, {
    body: payload,
    method: "PATCH",
  });
}

export function publishDestination(slug: string) {
  return apiRequest<Destination>(`/admin/destinations/${slug}/publish`, {
    method: "POST",
  });
}

export function archiveDestination(slug: string) {
  return apiRequest<Destination>(`/admin/destinations/${slug}/archive`, {
    method: "POST",
  });
}
