import { describe, expect, it } from "vitest";
import {
  transportComparisonRequestSchema,
  type TransportComparisonOption,
  type TransportComparisonRequest,
} from "@travelverse/contracts";
import { calculateTripCost, calculateTripNights, getTravellerCount } from "./transport-cost-engine";

const selectedOption: TransportComparisonOption = {
  arrivalLabel: "10:15",
  bookingHint: "Demo booking hint",
  confidence: "MEDIUM",
  departureLabel: "2026-08-20 08:00",
  distanceKm: 280,
  durationMinutes: 135,
  extraCharges: ["Convenience fee may apply"],
  fetchedAt: "2026-08-14T00:00:00.000Z",
  id: "rail-demo",
  mode: "rail",
  possibleTaxesInr: 300,
  pricePerTravellerInr: 900,
  provider: "TravelVerse Rail Estimator",
  source: "ESTIMATED",
  title: "Rail estimate",
  totalPriceInr: 2100,
  warnings: ["Estimated fare"],
};

describe("transport cost engine", () => {
  it("calculates trip nights from departure and return dates", () => {
    expect(calculateTripNights("2026-08-20", "2026-08-23")).toBe(3);
    expect(calculateTripNights("2026-08-20", "2026-08-20")).toBe(1);
    expect(calculateTripNights("2026-08-20")).toBe(2);
  });

  it("multiplies trip costs by traveller count", () => {
    const soloRequest = createRequest({ adults: 1, children: 0 });
    const familyRequest = createRequest({ adults: 2, children: 1 });

    const soloCost = calculateTripCost(soloRequest, selectedOption);
    const familyCost = calculateTripCost(familyRequest, selectedOption);

    expect(getTravellerCount(familyRequest)).toBe(3);
    expect(familyCost.totals.travellers).toBe(3);
    expect(familyCost.totals.foodInr).toBeGreaterThan(soloCost.totals.foodInr);
    expect(familyCost.totals.estimatedTripTotalInr).toBeGreaterThan(
      soloCost.totals.estimatedTripTotalInr,
    );
  });

  it("keeps currency explicit and defaults to INR", () => {
    const request = transportComparisonRequestSchema.parse({
      departureDate: "2026-08-20",
      destination: "Jaipur",
      origin: "Delhi",
      travellers: {
        adults: 1,
        children: 0,
      },
    });

    expect(request.currency).toBe("INR");
  });

  it("rejects return dates before departure dates", () => {
    expect(() =>
      transportComparisonRequestSchema.parse({
        departureDate: "2026-08-20",
        destination: "Jaipur",
        origin: "Delhi",
        returnDate: "2026-08-19",
        travellers: {
          adults: 1,
          children: 0,
        },
      }),
    ).toThrow();
  });
});

function createRequest(
  travellers: TransportComparisonRequest["travellers"],
): TransportComparisonRequest {
  return transportComparisonRequestSchema.parse({
    currency: "INR",
    departureDate: "2026-08-20",
    destination: "Jaipur",
    origin: "Delhi",
    returnDate: "2026-08-23",
    travellers,
  });
}
