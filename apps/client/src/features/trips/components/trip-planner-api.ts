import type {
  BookingListResponse,
  BookingSimulationResponse,
  CreateBookingRequest,
  CreateItineraryRequest,
  HotelSearchQuery,
  HotelSearchResponse,
  Itinerary,
  ItineraryListResponse,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function searchHotels(query: HotelSearchQuery) {
  return apiGet<HotelSearchResponse>(`/hotels${toQueryString(query)}`);
}

export function createItinerary(payload: CreateItineraryRequest) {
  return apiRequest<Itinerary>("/itineraries", {
    body: payload,
    method: "POST",
  });
}

export function listItineraries() {
  return apiGet<ItineraryListResponse>("/itineraries");
}

export function createBooking(payload: CreateBookingRequest) {
  return apiRequest<BookingSimulationResponse>("/bookings", {
    body: payload,
    method: "POST",
  });
}

export function listBookings() {
  return apiGet<BookingListResponse>("/bookings");
}

function toQueryString(query: Record<string, unknown>) {
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
