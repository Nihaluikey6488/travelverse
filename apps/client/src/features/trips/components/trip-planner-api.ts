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
import {
  bookingListResponseSchema,
  bookingSimulationResponseSchema,
  hotelSearchResponseSchema,
  itineraryListResponseSchema,
  itinerarySchema,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function searchHotels(query: HotelSearchQuery) {
  return apiGet<HotelSearchResponse>(`/hotels${toQueryString(query)}`, (response) =>
    hotelSearchResponseSchema.parse(response),
  );
}

export function createItinerary(payload: CreateItineraryRequest) {
  return apiRequest<Itinerary>("/itineraries", {
    body: payload,
    method: "POST",
    parse: (response) => itinerarySchema.parse(response),
  });
}

export function listItineraries() {
  return apiGet<ItineraryListResponse>("/itineraries", (response) =>
    itineraryListResponseSchema.parse(response),
  );
}

export function createBooking(payload: CreateBookingRequest) {
  return apiRequest<BookingSimulationResponse>("/bookings", {
    body: payload,
    method: "POST",
    parse: (response) => bookingSimulationResponseSchema.parse(response),
  });
}

export function listBookings() {
  return apiGet<BookingListResponse>("/bookings", (response) =>
    bookingListResponseSchema.parse(response),
  );
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
