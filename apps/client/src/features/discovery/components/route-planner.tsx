"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike,
  Car,
  Compass,
  Footprints,
  Loader2,
  LocateFixed,
  MapPinned,
  Navigation,
  Route,
  TriangleAlert,
} from "lucide-react";
import type {
  Attraction,
  Coordinates,
  RouteEstimateResponse,
  RouteTravelMode,
} from "@travelverse/contracts";
import { RouteMap, type RouteMapMarker } from "@/components/maps/route-map";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { estimateRoute } from "./destination-api";

type RoutePlannerProps = {
  attractions: Attraction[];
  destination: Coordinates;
  destinationName: string;
};

type OriginPreset = {
  coordinates: Coordinates;
  label: string;
};

const originPresets: OriginPreset[] = [
  {
    coordinates: {
      lat: 28.6139,
      lng: 77.209,
    },
    label: "Delhi",
  },
  {
    coordinates: {
      lat: 19.076,
      lng: 72.8777,
    },
    label: "Mumbai",
  },
  {
    coordinates: {
      lat: 12.9716,
      lng: 77.5946,
    },
    label: "Bengaluru",
  },
  {
    coordinates: {
      lat: 18.5204,
      lng: 73.8567,
    },
    label: "Pune",
  },
];

const travelModes: Array<{
  icon: typeof Car;
  label: string;
  value: RouteTravelMode;
}> = [
  {
    icon: Car,
    label: "Car",
    value: "car",
  },
  {
    icon: Bike,
    label: "Bike",
    value: "bike",
  },
  {
    icon: Footprints,
    label: "Walk",
    value: "walk",
  },
];

export function RoutePlanner({ attractions, destination, destinationName }: RoutePlannerProps) {
  const [geolocationMessage, setGeolocationMessage] = useState("Manual origin available.");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<RouteTravelMode>("car");
  const [origin, setOrigin] = useState<Coordinates>(originPresets[0].coordinates);
  const [originLabel, setOriginLabel] = useState(originPresets[0].label);
  const [manualLat, setManualLat] = useState(String(originPresets[0].coordinates.lat));
  const [manualLng, setManualLng] = useState(String(originPresets[0].coordinates.lng));
  const [route, setRoute] = useState<RouteEstimateResponse | null>(null);
  const [routeError, setRouteError] = useState("");

  const nearbyMarkers = useMemo<RouteMapMarker[]>(
    () =>
      attractions
        .filter((attraction) => Boolean(attraction.coordinates))
        .slice(0, 6)
        .map((attraction) => ({
          coordinates: attraction.coordinates as Coordinates,
          id: attraction.name,
          label: attraction.name,
          type: "nearby",
        })),
    [attractions],
  );

  function applyOrigin(nextOrigin: Coordinates, nextLabel: string) {
    setOrigin(nextOrigin);
    setOriginLabel(nextLabel);
    setManualLat(String(nextOrigin.lat));
    setManualLng(String(nextOrigin.lng));
  }

  function applyManualOrigin() {
    const lat = Number(manualLat);
    const lng = Number(manualLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setRouteError("Valid latitude/longitude enter karo. Example: 28.6139, 77.209");
      return;
    }

    applyOrigin(
      {
        lat,
        lng,
      },
      "Manual origin",
    );
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeolocationMessage("Browser geolocation support nahi karta. Manual origin use karo.");
      return;
    }

    setGeolocationMessage("Location permission requesting...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = {
          lat: roundTo(position.coords.latitude, 5),
          lng: roundTo(position.coords.longitude, 5),
        };

        applyOrigin(nextOrigin, "Your location");
        setGeolocationMessage("Current location selected. Route refreshed.");
      },
      () => {
        setGeolocationMessage("Location denied/unavailable. Manual origin and presets still work.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }

  const calculateRoute = useCallback(async () => {
    setIsLoading(true);
    setRouteError("");

    try {
      const response = await estimateRoute({
        destination,
        mode,
        origin,
      });

      setRoute(response);
    } catch (error: unknown) {
      setRoute(null);
      setRouteError(error instanceof Error ? error.message : "Route estimate failed");
    } finally {
      setIsLoading(false);
    }
  }, [destination, mode, origin]);

  useEffect(() => {
    void calculateRoute();
  }, [calculateRoute]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-teal-200">
            <HydrationSafeIcon className="h-4 w-4" icon={Route} />
            Live route planner
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Plan route to {destinationName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
            Location permission optional hai. Agar deny bhi kar do, presets ya manual coordinates se
            route estimate nikal sakta hai.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-white"
          onClick={requestLocation}
          type="button"
        >
          <HydrationSafeIcon className="h-4 w-4" icon={LocateFixed} />
          Use my location
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="grid content-start gap-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <HydrationSafeIcon className="h-4 w-4 text-teal-200" icon={Compass} />
              Choose origin
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {originPresets.map((preset) => (
                <button
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                    originLabel === preset.label
                      ? "border-teal-200/70 bg-teal-200/10 text-teal-50"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30"
                  }`}
                  key={preset.label}
                  onClick={() => applyOrigin(preset.coordinates, preset.label)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                aria-label="Origin latitude"
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-200/70"
                onChange={(event) => setManualLat(event.target.value)}
                placeholder="Lat"
                value={manualLat}
              />
              <input
                aria-label="Origin longitude"
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-200/70"
                onChange={(event) => setManualLng(event.target.value)}
                placeholder="Lng"
                value={manualLng}
              />
              <button
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:border-teal-200/70"
                onClick={applyManualOrigin}
                type="button"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <HydrationSafeIcon className="h-4 w-4 text-amber-200" icon={Navigation} />
              Travel mode
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {travelModes.map(({ icon, label, value }) => (
                <button
                  className={`inline-flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                    mode === value
                      ? "border-amber-200/80 bg-amber-200/15 text-amber-50"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30"
                  }`}
                  key={value}
                  onClick={() => setMode(value)}
                  type="button"
                >
                  <HydrationSafeIcon className="h-5 w-5" icon={icon} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
            <p className="flex items-center gap-2 font-bold text-teal-100">
              <HydrationSafeIcon className="h-4 w-4" icon={MapPinned} />
              {geolocationMessage}
            </p>
            <p className="mt-2">
              Destination fixed hai: {destinationName}. User origin choose karke route/distance
              calculate kar sakta hai.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <RouteMap
            destination={destination}
            destinationLabel={destinationName}
            markers={nearbyMarkers}
            origin={origin}
            originLabel={originLabel}
            routeGeometry={route?.geometry}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <RouteMetric
              label="Distance"
              loading={isLoading}
              value={route ? `${route.distanceKm.toLocaleString("en-IN")} km` : "—"}
            />
            <RouteMetric
              label="Duration"
              loading={isLoading}
              value={route ? formatDuration(route.durationMinutes) : "—"}
            />
            <RouteMetric
              label="Source"
              loading={isLoading}
              value={route ? (route.source === "LIVE_PROVIDER" ? "Live provider" : "Estimated") : "—"}
            />
          </div>

          {route?.cacheHit ? (
            <p className="rounded-2xl border border-teal-200/20 bg-teal-200/10 px-4 py-3 text-sm text-teal-50">
              Cached route used for faster response.
            </p>
          ) : null}

          {route?.warnings.map((warning) => (
            <p
              className="flex items-start gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-50"
              key={warning}
            >
              <HydrationSafeIcon className="mt-0.5 h-4 w-4 shrink-0" icon={TriangleAlert} />
              {warning}
            </p>
          ))}

          {routeError ? (
            <p className="flex items-start gap-2 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-sm leading-6 text-red-50">
              <HydrationSafeIcon className="mt-0.5 h-4 w-4 shrink-0" icon={TriangleAlert} />
              {routeError}
            </p>
          ) : null}

          {isLoading ? (
            <p className="inline-flex items-center gap-2 text-sm text-slate-400">
              <HydrationSafeIcon className="h-4 w-4 animate-spin" icon={Loader2} />
              Calculating route...
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RouteMetric({
  label,
  loading,
  value,
}: {
  label: string;
  loading: boolean;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{loading ? "..." : value}</p>
    </div>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function roundTo(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
