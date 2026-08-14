import { Injectable } from "@nestjs/common";
import type {
  TransportComparisonOption,
  TransportComparisonRequest,
  TransportMode,
  TransportProviderContract,
} from "@travelverse/contracts";
import type { TransportQuoteContext, TransportQuoteProvider } from "./transport-provider.interface";

type QuoteInput = {
  bookingHint: string;
  confidence: TransportComparisonOption["confidence"];
  distanceKm: number;
  durationMinutes: number;
  extraCharges: string[];
  mode: TransportMode;
  possibleTaxesInr: number;
  pricePerTravellerInr: number;
  provider: string;
  request: TransportComparisonRequest;
  source: TransportProviderContract["source"];
  title: string;
  totalPriceInr?: number;
  warnings: string[];
};

@Injectable()
export class SandboxFlightProvider implements TransportQuoteProvider {
  readonly contract: TransportProviderContract = {
    mode: "flight",
    notes:
      "Sandbox fare based on distance, date demand and traveller count. It is not a live airline seat price.",
    providerName: "TravelVerse Sandbox Air",
    source: "SANDBOX",
    supportsLivePricing: false,
  };

  quote(
    request: TransportComparisonRequest,
    context: TransportQuoteContext,
  ): TransportComparisonOption {
    const demandMultiplier = getDateDemandMultiplier(request.departureDate);
    const pricePerAdult = Math.round(
      (2200 + context.distance.directDistanceKm * 5.4) * demandMultiplier,
    );
    const travellerSubtotal = calculateTravellerSubtotal(pricePerAdult, request);
    const taxes = Math.round(travellerSubtotal * 0.12);

    return createQuote({
      bookingHint:
        "Good for long-distance trips when time matters. Verify airline baggage and seat fees before booking.",
      confidence: "HIGH",
      distanceKm: context.distance.directDistanceKm,
      durationMinutes: Math.max(
        55,
        Math.round(45 + (context.distance.directDistanceKm / 720) * 60),
      ),
      extraCharges: [
        "Baggage fees may apply",
        "Seat selection can be extra",
        "Airport transfer not included",
      ],
      mode: "flight",
      possibleTaxesInr: taxes,
      pricePerTravellerInr: pricePerAdult,
      provider: this.contract.providerName,
      request,
      source: this.contract.source,
      title: "Fastest flight window",
      totalPriceInr: travellerSubtotal + taxes,
      warnings: ["SANDBOX fare: use it for planning only, not ticket purchase guarantee."],
    });
  }
}

@Injectable()
export class EstimatedRailProvider implements TransportQuoteProvider {
  readonly contract: TransportProviderContract = {
    mode: "rail",
    notes:
      "Estimated express train pricing because no live railway pricing provider is connected yet.",
    providerName: "TravelVerse Rail Estimator",
    source: "ESTIMATED",
    supportsLivePricing: false,
  };

  quote(
    request: TransportComparisonRequest,
    context: TransportQuoteContext,
  ): TransportComparisonOption {
    const pricePerAdult = Math.round(420 + context.distance.roadDistanceKm * 1.25);
    const travellerSubtotal = calculateTravellerSubtotal(pricePerAdult, request, 0.65);
    const taxes = Math.round(travellerSubtotal * 0.05);

    return createQuote({
      bookingHint: "Usually balanced for budget trips. Check current seat availability separately.",
      confidence: "MEDIUM",
      distanceKm: context.distance.roadDistanceKm,
      durationMinutes: Math.max(90, Math.round(70 + (context.distance.roadDistanceKm / 58) * 60)),
      extraCharges: ["Dynamic train availability not connected", "Food onboard may be extra"],
      mode: "rail",
      possibleTaxesInr: taxes,
      pricePerTravellerInr: pricePerAdult,
      provider: this.contract.providerName,
      request,
      source: this.contract.source,
      title: "Balanced rail estimate",
      totalPriceInr: travellerSubtotal + taxes,
      warnings: ["ESTIMATED fare: live IRCTC/rail inventory is not connected."],
    });
  }
}

@Injectable()
export class EstimatedBusProvider implements TransportQuoteProvider {
  readonly contract: TransportProviderContract = {
    mode: "bus",
    notes: "Estimated sleeper/volvo bus pricing for routes where bus travel is practical.",
    providerName: "TravelVerse Bus Estimator",
    source: "ESTIMATED",
    supportsLivePricing: false,
  };

  quote(
    request: TransportComparisonRequest,
    context: TransportQuoteContext,
  ): TransportComparisonOption {
    const pricePerAdult = Math.round(360 + context.distance.roadDistanceKm * 1.05);
    const travellerSubtotal = calculateTravellerSubtotal(pricePerAdult, request, 0.75);
    const taxes = Math.round(travellerSubtotal * 0.07);

    return createQuote({
      bookingHint:
        "Useful for budget travel and overnight routes. Confirm boarding point before purchase.",
      confidence: "MEDIUM",
      distanceKm: context.distance.roadDistanceKm,
      durationMinutes: Math.max(80, Math.round(50 + (context.distance.roadDistanceKm / 46) * 60)),
      extraCharges: ["Boarding point transfers may be extra", "Peak date surge not connected"],
      mode: "bus",
      possibleTaxesInr: taxes,
      pricePerTravellerInr: pricePerAdult,
      provider: this.contract.providerName,
      request,
      source: this.contract.source,
      title: "Budget bus estimate",
      totalPriceInr: travellerSubtotal + taxes,
      warnings: ["ESTIMATED fare: live bus operator inventory is not connected."],
    });
  }
}

@Injectable()
export class EstimatedDrivingProvider implements TransportQuoteProvider {
  readonly contract: TransportProviderContract = {
    mode: "car",
    notes: "Estimated road-trip cost based on road distance, fuel, tolls and parking buffer.",
    providerName: "TravelVerse Road Cost Engine",
    source: "ESTIMATED",
    supportsLivePricing: false,
  };

  quote(
    request: TransportComparisonRequest,
    context: TransportQuoteContext,
  ): TransportComparisonOption {
    const fuelAndWear = Math.round(context.distance.roadDistanceKm * 13.5);
    const tollsAndParking = Math.round(650 + context.distance.roadDistanceKm * 1.15);
    const totalPriceInr = fuelAndWear + tollsAndParking;

    return createQuote({
      bookingHint:
        "Best when you want flexible local stops. Cost is vehicle-level, not per-seat ticket.",
      confidence: "LOW",
      distanceKm: context.distance.roadDistanceKm,
      durationMinutes: Math.max(45, Math.round(35 + (context.distance.roadDistanceKm / 48) * 60)),
      extraCharges: [
        "Fuel prices vary",
        "Tolls and parking are estimates",
        "Driver stay not included",
      ],
      mode: "car",
      possibleTaxesInr: tollsAndParking,
      pricePerTravellerInr: Math.ceil(totalPriceInr / context.travellerCount),
      provider: this.contract.providerName,
      request,
      source: this.contract.source,
      title: "Flexible road trip estimate",
      totalPriceInr,
      warnings: ["ESTIMATED route cost: live fuel, toll and traffic pricing is not connected."],
    });
  }
}

function createQuote(input: QuoteInput): TransportComparisonOption {
  const totalPriceInr =
    input.totalPriceInr ??
    input.pricePerTravellerInr *
      (input.request.travellers.adults + input.request.travellers.children) +
      input.possibleTaxesInr;
  const departureHour =
    input.mode === "flight" ? "08:20" : input.mode === "rail" ? "06:45" : "07:30";

  return {
    arrivalLabel: addMinutesToTimeLabel(departureHour, input.durationMinutes),
    bookingHint: input.bookingHint,
    confidence: input.confidence,
    departureLabel: `${input.request.departureDate} ${departureHour}`,
    distanceKm: Math.round(input.distanceKm),
    durationMinutes: input.durationMinutes,
    extraCharges: input.extraCharges,
    fetchedAt: new Date().toISOString(),
    id: `${input.mode}-${slugify(input.provider)}`,
    mode: input.mode,
    possibleTaxesInr: input.possibleTaxesInr,
    pricePerTravellerInr: input.pricePerTravellerInr,
    provider: input.provider,
    source: input.source,
    title: input.title,
    totalPriceInr,
    warnings: input.warnings,
  };
}

function calculateTravellerSubtotal(
  pricePerAdult: number,
  request: TransportComparisonRequest,
  childMultiplier = 0.72,
) {
  return Math.round(
    pricePerAdult * request.travellers.adults +
      pricePerAdult * childMultiplier * request.travellers.children,
  );
}

function getDateDemandMultiplier(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  const day = date.getUTCDay();

  return day === 0 || day === 5 || day === 6 ? 1.14 : 1;
}

function addMinutesToTimeLabel(startTime: string, minutes: number) {
  const [hour, minute] = startTime.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + minutes;
  const normalized = totalMinutes % (24 * 60);
  const daysLater = Math.floor(totalMinutes / (24 * 60));
  const nextHour = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const nextMinute = (normalized % 60).toString().padStart(2, "0");

  return `${nextHour}:${nextMinute}${daysLater > 0 ? ` +${daysLater}d` : ""}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
