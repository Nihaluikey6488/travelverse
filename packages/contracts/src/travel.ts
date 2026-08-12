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

export const hotelSchema = z.object({
  id: mongoIdSchema,
  destinationSlug: slugSchema,
  name: z.string(),
  address: z.string(),
  rating: z.number().min(0).max(5),
  amenities: z.array(z.string()),
  rooms: z.array(roomSchema),
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

export const bookingSchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema,
  destinationSlug: slugSchema,
  hotelId: mongoIdSchema.optional(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().positive(),
  status: bookingStatusSchema,
  estimatedTotalInr: z.number().int().nonnegative(),
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
export type RouteTravelMode = z.infer<typeof routeTravelModeSchema>;
export type RouteEstimateRequest = z.infer<typeof routeEstimateRequestSchema>;
export type RouteEstimateResponse = z.infer<typeof routeEstimateResponseSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Hotel = z.infer<typeof hotelSchema>;
export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Favourite = z.infer<typeof favouriteSchema>;
