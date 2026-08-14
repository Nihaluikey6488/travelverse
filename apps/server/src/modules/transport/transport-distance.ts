import type { Coordinates } from "@travelverse/contracts";

export type ResolvedTravelDistance = {
  directDistanceKm: number;
  destination: ResolvedTravelLocation;
  origin: ResolvedTravelLocation;
  roadDistanceKm: number;
  warnings: string[];
};

export type ResolvedTravelLocation = {
  coordinates: Coordinates;
  isEstimated: boolean;
  label: string;
};

const knownLocations: Record<string, Coordinates> = {
  agra: { lat: 27.1767, lng: 78.0081 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  delhi: { lat: 28.6139, lng: 77.209 },
  goa: { lat: 15.2993, lng: 74.124 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  manali: { lat: 32.2432, lng: 77.1892 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
};

export function resolveTravelDistance(
  originInput: string,
  destinationInput: string,
): ResolvedTravelDistance {
  const origin = resolveLocation(originInput);
  const destination = resolveLocation(destinationInput);
  const directDistanceKm = roundTo(getDistanceKm(origin.coordinates, destination.coordinates), 1);
  const safeDistanceKm =
    directDistanceKm < 30
      ? deterministicFallbackDistance(originInput, destinationInput)
      : directDistanceKm;
  const roadDistanceKm = roundTo(safeDistanceKm * 1.18, 1);
  const warnings: string[] = [];

  if (origin.isEstimated) {
    warnings.push(
      `Origin "${originInput}" is not in the demo city table, so distance is estimated.`,
    );
  }

  if (destination.isEstimated) {
    warnings.push(
      `Destination "${destinationInput}" is not in the demo city table, so distance is estimated.`,
    );
  }

  return {
    destination,
    directDistanceKm: safeDistanceKm,
    origin,
    roadDistanceKm,
    warnings,
  };
}

function resolveLocation(input: string): ResolvedTravelLocation {
  const label = input.trim();
  const key = normaliseLocationKey(label);
  const knownCoordinates = knownLocations[key];

  if (knownCoordinates) {
    return {
      coordinates: knownCoordinates,
      isEstimated: false,
      label,
    };
  }

  return {
    coordinates: fallbackCoordinates(label),
    isEstimated: true,
    label,
  };
}

function fallbackCoordinates(label: string): Coordinates {
  const hash = hashText(label);
  const lat = 8 + (hash % 2800) / 100;
  const lng = 68 + (Math.floor(hash / 2800) % 2800) / 100;

  return {
    lat: roundTo(Math.min(36, lat), 4),
    lng: roundTo(Math.min(96, lng), 4),
  };
}

function deterministicFallbackDistance(origin: string, destination: string): number {
  const hash = hashText(`${origin}:${destination}`);

  return 220 + (hash % 1450);
}

function normaliseLocationKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")[0];
}

function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * angularDistance;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function hashText(value: string) {
  return value.split("").reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 17);
}

export function roundTo(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
