import { Injectable } from "@nestjs/common";
import type {
  TransportComparisonOption,
  TransportComparisonRequest,
  TransportCostBreakdownItem,
  TripCostSummary,
} from "@travelverse/contracts";

export type CalculatedTripCost = {
  costBreakdown: TransportCostBreakdownItem[];
  totals: TripCostSummary;
};

type DestinationBudgetProfile = {
  attractionTicketPerTravellerInr: number;
  foodPerTravellerPerDayInr: number;
  localTravelPerGroupPerDayInr: number;
  roomPerNightInr: number;
};

const defaultBudgetProfile: DestinationBudgetProfile = {
  attractionTicketPerTravellerInr: 1200,
  foodPerTravellerPerDayInr: 900,
  localTravelPerGroupPerDayInr: 850,
  roomPerNightInr: 3200,
};

const destinationBudgetProfiles: Record<string, DestinationBudgetProfile> = {
  goa: {
    attractionTicketPerTravellerInr: 1600,
    foodPerTravellerPerDayInr: 1300,
    localTravelPerGroupPerDayInr: 1400,
    roomPerNightInr: 5200,
  },
  jaipur: {
    attractionTicketPerTravellerInr: 1400,
    foodPerTravellerPerDayInr: 850,
    localTravelPerGroupPerDayInr: 900,
    roomPerNightInr: 3600,
  },
  manali: {
    attractionTicketPerTravellerInr: 1800,
    foodPerTravellerPerDayInr: 1000,
    localTravelPerGroupPerDayInr: 1300,
    roomPerNightInr: 4200,
  },
  varanasi: {
    attractionTicketPerTravellerInr: 900,
    foodPerTravellerPerDayInr: 700,
    localTravelPerGroupPerDayInr: 750,
    roomPerNightInr: 2800,
  },
};

@Injectable()
export class TransportCostEngine {
  calculate(
    request: TransportComparisonRequest,
    selectedOption: TransportComparisonOption,
  ): CalculatedTripCost {
    return calculateTripCost(request, selectedOption);
  }
}

export function calculateTripCost(
  request: TransportComparisonRequest,
  selectedOption: TransportComparisonOption,
): CalculatedTripCost {
  const travellerCount = getTravellerCount(request);
  const nights = calculateTripNights(request.departureDate, request.returnDate);
  const days = nights + 1;
  const profile = resolveDestinationBudget(request.destination);
  const roomCount = Math.ceil(travellerCount / 2);
  const accommodationInr = profile.roomPerNightInr * roomCount * nights;
  const foodInr = profile.foodPerTravellerPerDayInr * travellerCount * days;
  const localTravelInr =
    profile.localTravelPerGroupPerDayInr * Math.ceil(travellerCount / 3) * days;
  const attractionTicketsInr = profile.attractionTicketPerTravellerInr * travellerCount;
  const subtotal =
    selectedOption.totalPriceInr +
    accommodationInr +
    foodInr +
    localTravelInr +
    attractionTicketsInr;
  const taxesAndBufferInr = Math.round(subtotal * 0.1);
  const estimatedTripTotalInr = subtotal + taxesAndBufferInr;

  return {
    costBreakdown: [
      {
        amountInr: selectedOption.totalPriceInr,
        key: "transport",
        label: `Transport via ${selectedOption.mode}`,
        notes: `${selectedOption.source} ${selectedOption.provider}`,
        source: selectedOption.source,
      },
      {
        amountInr: accommodationInr,
        key: "accommodation",
        label: `${nights} night stay estimate`,
        notes: `${roomCount} room(s), mid-range property assumption`,
        source: "ESTIMATED",
      },
      {
        amountInr: foodInr,
        key: "food",
        label: "Food and cafe budget",
        notes: `${days} day(s) x ${travellerCount} traveller(s)`,
        source: "ESTIMATED",
      },
      {
        amountInr: localTravelInr,
        key: "localTravel",
        label: "Local travel buffer",
        notes: "Cabs, autos, parking and short transfers",
        source: "ESTIMATED",
      },
      {
        amountInr: attractionTicketsInr,
        key: "attractions",
        label: "Attraction tickets",
        notes: "Entry tickets and activity buffer",
        source: "ESTIMATED",
      },
      {
        amountInr: taxesAndBufferInr,
        key: "taxesAndBuffer",
        label: "Taxes and uncertainty buffer",
        notes: "10% buffer for taxes, convenience fees and price changes",
        source: "ESTIMATED",
      },
    ],
    totals: {
      accommodationInr,
      attractionTicketsInr,
      estimatedTripTotalInr,
      foodInr,
      localTravelInr,
      nights,
      taxesAndBufferInr,
      transportInr: selectedOption.totalPriceInr,
      travellers: travellerCount,
    },
  };
}

export function calculateTripNights(departureDate: string, returnDate?: string): number {
  if (!returnDate) {
    return 2;
  }

  const differenceMs = dateInputToUtc(returnDate) - dateInputToUtc(departureDate);
  const differenceDays = Math.ceil(differenceMs / 86_400_000);

  return Math.max(1, differenceDays);
}

export function getTravellerCount(request: TransportComparisonRequest): number {
  return request.travellers.adults + request.travellers.children;
}

function resolveDestinationBudget(destination: string): DestinationBudgetProfile {
  const key = destination
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")[0];

  return destinationBudgetProfiles[key] ?? defaultBudgetProfile;
}

function dateInputToUtc(value: string): number {
  const [year, month, day] = value.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}
