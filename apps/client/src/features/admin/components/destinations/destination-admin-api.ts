import type {
  Destination,
  DestinationImportCandidate,
  DestinationImportPreview,
  DestinationImportResult,
  DestinationImportSearchResponse,
  DestinationListResponse,
  UpdateDestinationRequest,
  UpsertDestinationRequest,
} from "@travelverse/contracts";
import {
  destinationImportPreviewSchema,
  destinationImportResultSchema,
  destinationImportSearchResponseSchema,
  destinationListResponseSchema,
  destinationSchema,
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

  return apiGet<DestinationListResponse>(`/admin/destinations?${query.toString()}`, (response) =>
    destinationListResponseSchema.parse(response),
  );
}

export function createDestination(payload: UpsertDestinationRequest) {
  return apiRequest<Destination>("/admin/destinations", {
    body: payload,
    method: "POST",
    parse: (response) => destinationSchema.parse(response),
  });
}

export function updateDestination(slug: string, payload: UpdateDestinationRequest) {
  return apiRequest<Destination>(`/admin/destinations/${slug}`, {
    body: payload,
    method: "PATCH",
    parse: (response) => destinationSchema.parse(response),
  });
}

export function publishDestination(slug: string) {
  return apiRequest<Destination>(`/admin/destinations/${slug}/publish`, {
    method: "POST",
    parse: (response) => destinationSchema.parse(response),
  });
}

export function archiveDestination(slug: string) {
  return apiRequest<Destination>(`/admin/destinations/${slug}/archive`, {
    method: "POST",
    parse: (response) => destinationSchema.parse(response),
  });
}

export function searchImportCandidates(query: string) {
  const search = new URLSearchParams({
    limit: "5",
    query,
  });

  return apiGet<DestinationImportSearchResponse>(
    `/admin/destinations/import/search?${search}`,
    (response) => destinationImportSearchResponseSchema.parse(response),
  );
}

export function previewDestinationImport(candidate: DestinationImportCandidate) {
  return apiRequest<DestinationImportPreview>("/admin/destinations/import/preview", {
    body: {
      candidate,
    },
    method: "POST",
    parse: (response) => destinationImportPreviewSchema.parse(response),
  });
}

export function importDestinationDraft(candidate: DestinationImportCandidate) {
  return apiRequest<DestinationImportResult>("/admin/destinations/import", {
    body: {
      candidate,
    },
    method: "POST",
    parse: (response) => destinationImportResultSchema.parse(response),
  });
}
