import { z } from "zod";
import {
  bookingStatusSchema,
  coordinatesSchema,
  mongoIdSchema,
  slugSchema,
  transportModeSchema,
} from "./common";

export const transportEstimateSchema = z.object({
  mode: transportModeSchema,
  from: z.string(),
  to: z.string(),
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().int().nonnegative(),
  estimatedCostInr: z.number().int().nonnegative(),
  source: z.string(),
  isLivePrice: z.boolean(),
});

export const transportPriceSourceSchema = z.enum(["LIVE", "SANDBOX", "ESTIMATED"]);

export const transportProviderContractSchema = z.object({
  mode: transportModeSchema,
  notes: z.string(),
  providerName: z.string(),
  source: transportPriceSourceSchema,
  supportsLivePricing: z.boolean(),
});

export const travellerGroupSchema = z
  .object({
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(9).default(0),
  })
  .refine((travellers) => travellers.adults + travellers.children > 0, {
    message: "At least one traveller is required",
  });

const travelDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format");

export const transportComparisonRequestSchema = z
  .object({
    currency: z.enum(["INR"]).default("INR"),
    departureDate: travelDateSchema,
    destination: z.string().trim().min(2).max(120),
    origin: z.string().trim().min(2).max(120),
    returnDate: travelDateSchema.optional(),
    travellers: travellerGroupSchema.default({ adults: 1, children: 0 }),
  })
  .superRefine((request, context) => {
    if (!isValidDateInput(request.departureDate)) {
      context.addIssue({
        code: "custom",
        message: "Departure date is not valid",
        path: ["departureDate"],
      });
    }

    if (request.returnDate && !isValidDateInput(request.returnDate)) {
      context.addIssue({
        code: "custom",
        message: "Return date is not valid",
        path: ["returnDate"],
      });
    }

    if (
      request.returnDate &&
      isValidDateInput(request.departureDate) &&
      isValidDateInput(request.returnDate) &&
      dateInputToUtc(request.returnDate) < dateInputToUtc(request.departureDate)
    ) {
      context.addIssue({
        code: "custom",
        message: "Return date cannot be before departure date",
        path: ["returnDate"],
      });
    }
  });

export const transportCostBreakdownItemSchema = z.object({
  amountInr: z.number().int().nonnegative(),
  key: z.string(),
  label: z.string(),
  notes: z.string().optional(),
  source: transportPriceSourceSchema,
});

export const transportComparisonOptionSchema = z.object({
  arrivalLabel: z.string(),
  bookingHint: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  departureLabel: z.string(),
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  extraCharges: z.array(z.string()),
  fetchedAt: z.string().datetime(),
  id: z.string(),
  mode: transportModeSchema,
  possibleTaxesInr: z.number().int().nonnegative(),
  pricePerTravellerInr: z.number().int().nonnegative(),
  provider: z.string(),
  source: transportPriceSourceSchema,
  title: z.string(),
  totalPriceInr: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
});

export const transportComparisonRecommendationSchema = z.object({
  cheapestOptionId: z.string(),
  fastestOptionId: z.string(),
  recommendedOptionId: z.string(),
});

export const tripCostSummarySchema = z.object({
  accommodationInr: z.number().int().nonnegative(),
  attractionTicketsInr: z.number().int().nonnegative(),
  estimatedTripTotalInr: z.number().int().nonnegative(),
  foodInr: z.number().int().nonnegative(),
  localTravelInr: z.number().int().nonnegative(),
  nights: z.number().int().positive(),
  taxesAndBufferInr: z.number().int().nonnegative(),
  transportInr: z.number().int().nonnegative(),
  travellers: z.number().int().positive(),
});

export const transportComparisonResponseSchema = z.object({
  costBreakdown: z.array(transportCostBreakdownItemSchema),
  currency: z.enum(["INR"]),
  fetchedAt: z.string().datetime(),
  options: z.array(transportComparisonOptionSchema),
  providers: z.array(transportProviderContractSchema),
  recommendations: transportComparisonRecommendationSchema,
  request: transportComparisonRequestSchema,
  totals: tripCostSummarySchema,
  warnings: z.array(z.string()),
});

export const routeTravelModeSchema = z.enum(["car", "bike", "walk"]);

export const routeEstimateRequestSchema = z.object({
  destination: coordinatesSchema,
  mode: routeTravelModeSchema.default("car"),
  origin: coordinatesSchema,
});

export const routeEstimateResponseSchema = z.object({
  cacheHit: z.boolean(),
  destination: coordinatesSchema,
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().int().nonnegative(),
  fetchedAt: z.string().datetime(),
  geometry: z.array(coordinatesSchema).min(2),
  mode: routeTravelModeSchema,
  origin: coordinatesSchema,
  provider: z.string(),
  source: z.enum(["LIVE_PROVIDER", "ESTIMATED_FALLBACK"]),
  warnings: z.array(z.string()),
});

export const roomSchema = z.object({
  id: mongoIdSchema,
  name: z.string(),
  capacity: z.number().int().positive(),
  basePriceInr: z.number().int().nonnegative(),
  amenities: z.array(z.string()),
});

export const hotelPricingModeSchema = z.enum(["LIVE", "SANDBOX", "ESTIMATED"]);

export const hotelSchema = z.object({
  id: mongoIdSchema,
  destinationSlug: slugSchema,
  name: z.string(),
  address: z.string(),
  coordinates: coordinatesSchema.optional(),
  pricingMode: hotelPricingModeSchema.default("ESTIMATED"),
  rating: z.number().min(0).max(5),
  amenities: z.array(z.string()),
  rooms: z.array(roomSchema),
});

export const hotelSearchQuerySchema = z
  .object({
    amenity: z.string().trim().min(1).optional(),
    checkIn: travelDateSchema,
    checkOut: travelDateSchema,
    destinationSlug: slugSchema,
    guests: z.coerce.number().int().min(1).max(12).default(2),
    maxPriceInr: z.coerce.number().int().positive().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
  })
  .superRefine((query, context) => {
    addDateRangeIssues(query.checkIn, query.checkOut, context);
  });

export const hotelAvailabilityRoomSchema = roomSchema.extend({
  estimatedTotalInr: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  nights: z.number().int().positive(),
  unavailableReason: z.string().optional(),
});

export const hotelAvailabilitySchema = hotelSchema.extend({
  availableRoomCount: z.number().int().nonnegative(),
  lowestNightlyRateInr: z.number().int().nonnegative(),
  rooms: z.array(hotelAvailabilityRoomSchema),
});

export const hotelSearchResponseSchema = z.object({
  checkIn: travelDateSchema,
  checkOut: travelDateSchema,
  currency: z.enum(["INR"]),
  destinationSlug: slugSchema,
  fetchedAt: z.string().datetime(),
  guests: z.number().int().positive(),
  hotels: z.array(hotelAvailabilitySchema),
  nights: z.number().int().positive(),
  warnings: z.array(z.string()),
});

export const itineraryStopSchema = z.object({
  title: z.string(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
  notes: z.string(),
  estimatedCostInr: z.number().int().nonnegative(),
});

export const itinerarySchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema,
  destinationSlug: slugSchema,
  days: z.array(
    z.object({
      day: z.number().int().positive(),
      stops: z.array(itineraryStopSchema),
    }),
  ),
  estimatedTotalInr: z.number().int().nonnegative(),
});

export const createItineraryRequestSchema = z.object({
  destinationSlug: slugSchema,
  days: z.array(
    z.object({
      day: z.number().int().positive(),
      stops: z.array(itineraryStopSchema).min(1),
    }),
  ),
});

export const itineraryListResponseSchema = z.object({
  itineraries: z.array(itinerarySchema),
});

export const bookingSchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema,
  destinationSlug: slugSchema,
  hotelId: mongoIdSchema.optional(),
  roomId: mongoIdSchema.optional(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().positive(),
  status: bookingStatusSchema,
  estimatedTotalInr: z.number().int().nonnegative(),
});

export const createBookingRequestSchema = z
  .object({
    checkIn: travelDateSchema,
    checkOut: travelDateSchema,
    destinationSlug: slugSchema,
    guests: z.coerce.number().int().min(1).max(12),
    hotelId: mongoIdSchema,
    itineraryId: mongoIdSchema.optional(),
    roomId: mongoIdSchema,
  })
  .superRefine((request, context) => {
    addDateRangeIssues(request.checkIn, request.checkOut, context);
  });

export const bookingSimulationResponseSchema = z.object({
  booking: bookingSchema,
  currency: z.enum(["INR"]),
  hotel: hotelSchema,
  nights: z.number().int().positive(),
  room: roomSchema,
  warnings: z.array(z.string()),
});

export const bookingListResponseSchema = z.object({
  bookings: z.array(bookingSchema),
});

export const reviewSchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema,
  destinationSlug: slugSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000),
  isPublished: z.boolean(),
});

export const favouriteSchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema,
  destinationSlug: slugSchema,
});

export type TransportEstimate = z.infer<typeof transportEstimateSchema>;
export type TransportPriceSource = z.infer<typeof transportPriceSourceSchema>;
export type TransportProviderContract = z.infer<typeof transportProviderContractSchema>;
export type TravellerGroup = z.infer<typeof travellerGroupSchema>;
export type TransportComparisonRequest = z.infer<typeof transportComparisonRequestSchema>;
export type TransportCostBreakdownItem = z.infer<typeof transportCostBreakdownItemSchema>;
export type TransportComparisonOption = z.infer<typeof transportComparisonOptionSchema>;
export type TransportComparisonRecommendation = z.infer<
  typeof transportComparisonRecommendationSchema
>;
export type TripCostSummary = z.infer<typeof tripCostSummarySchema>;
export type TransportComparisonResponse = z.infer<typeof transportComparisonResponseSchema>;
export type RouteTravelMode = z.infer<typeof routeTravelModeSchema>;
export type RouteEstimateRequest = z.infer<typeof routeEstimateRequestSchema>;
export type RouteEstimateResponse = z.infer<typeof routeEstimateResponseSchema>;
export type Room = z.infer<typeof roomSchema>;
export type HotelPricingMode = z.infer<typeof hotelPricingModeSchema>;
export type Hotel = z.infer<typeof hotelSchema>;
export type HotelSearchQuery = z.infer<typeof hotelSearchQuerySchema>;
export type HotelAvailabilityRoom = z.infer<typeof hotelAvailabilityRoomSchema>;
export type HotelAvailability = z.infer<typeof hotelAvailabilitySchema>;
export type HotelSearchResponse = z.infer<typeof hotelSearchResponseSchema>;
export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type CreateItineraryRequest = z.infer<typeof createItineraryRequestSchema>;
export type ItineraryListResponse = z.infer<typeof itineraryListResponseSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
export type BookingSimulationResponse = z.infer<typeof bookingSimulationResponseSchema>;
export type BookingListResponse = z.infer<typeof bookingListResponseSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Favourite = z.infer<typeof favouriteSchema>;

function isValidDateInput(value: string): boolean {
  const timestamp = dateInputToUtc(value);

  return Number.isFinite(timestamp);
}

function addDateRangeIssues(startDate: string, endDate: string, context: z.RefinementCtx): void {
  if (!isValidDateInput(startDate)) {
    context.addIssue({
      code: "custom",
      message: "Start date is not valid",
      path: ["checkIn"],
    });
  }

  if (!isValidDateInput(endDate)) {
    context.addIssue({
      code: "custom",
      message: "End date is not valid",
      path: ["checkOut"],
    });
  }

  if (
    isValidDateInput(startDate) &&
    isValidDateInput(endDate) &&
    dateInputToUtc(endDate) <= dateInputToUtc(startDate)
  ) {
    context.addIssue({
      code: "custom",
      message: "End date must be after start date",
      path: ["checkOut"],
    });
  }
}

function dateInputToUtc(value: string): number {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return Number.NaN;
  }

  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return Number.NaN;
  }

  return timestamp;
}
