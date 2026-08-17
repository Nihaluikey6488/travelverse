import type {
  Destination,
  DestinationFacetResponse,
  DestinationListQuery,
  DestinationListResponse,
  FavouriteListResponse,
  FavouriteMutationResponse,
  RouteEstimateRequest,
  RouteEstimateResponse,
} from "@travelverse/contracts";
import {
  destinationFacetResponseSchema,
  destinationListResponseSchema,
  destinationSchema,
  favouriteListResponseSchema,
  favouriteMutationResponseSchema,
  routeEstimateResponseSchema,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function listDestinations(query: Partial<DestinationListQuery> = {}) {
  return apiGet<DestinationListResponse>(`/destinations${toQueryString(query)}`, (response) =>
    destinationListResponseSchema.parse(response),
  );
}

export function getDestination(slug: string) {
  return apiGet<Destination>(`/destinations/${slug}`, (response) =>
    destinationSchema.parse(response),
  );
}

export function getDestinationFacets() {
  return apiGet<DestinationFacetResponse>("/destinations/facets", (response) =>
    destinationFacetResponseSchema.parse(response),
  );
}

export function listFavourites() {
  return apiGet<FavouriteListResponse>("/favourites", (response) =>
    favouriteListResponseSchema.parse(response),
  );
}

export function addFavourite(destinationSlug: string) {
  return apiRequest<FavouriteMutationResponse>(`/favourites/${destinationSlug}`, {
    method: "POST",
    parse: (response) => favouriteMutationResponseSchema.parse(response),
  });
}

export function removeFavourite(destinationSlug: string) {
  return apiRequest<FavouriteMutationResponse>(`/favourites/${destinationSlug}`, {
    method: "DELETE",
    parse: (response) => favouriteMutationResponseSchema.parse(response),
  });
}

export function estimateRoute(payload: RouteEstimateRequest) {
  return apiRequest<RouteEstimateResponse>("/routes/estimate", {
    body: payload,
    method: "POST",
    parse: (response) => routeEstimateResponseSchema.parse(response),
  });
}

function toQueryString(query: Partial<DestinationListQuery>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
