import type {
  Destination,
  DestinationFacetResponse,
  DestinationListQuery,
  DestinationListResponse,
  FavouriteListResponse,
  FavouriteMutationResponse,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function listDestinations(query: Partial<DestinationListQuery> = {}) {
  return apiGet<DestinationListResponse>(`/destinations${toQueryString(query)}`);
}

export function getDestination(slug: string) {
  return apiGet<Destination>(`/destinations/${slug}`);
}

export function getDestinationFacets() {
  return apiGet<DestinationFacetResponse>("/destinations/facets");
}

export function listFavourites() {
  return apiGet<FavouriteListResponse>("/favourites");
}

export function addFavourite(destinationSlug: string) {
  return apiRequest<FavouriteMutationResponse>(`/favourites/${destinationSlug}`, {
    method: "POST",
  });
}

export function removeFavourite(destinationSlug: string) {
  return apiRequest<FavouriteMutationResponse>(`/favourites/${destinationSlug}`, {
    method: "DELETE",
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
