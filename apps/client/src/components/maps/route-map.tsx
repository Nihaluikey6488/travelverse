import type { Coordinates } from "@travelverse/contracts";

export type RouteMapMarker = {
  coordinates: Coordinates;
  id: string;
  label: string;
  type: "origin" | "destination" | "nearby";
};

export type RouteMapProps = {
  destination: Coordinates;
  destinationLabel: string;
  markers?: RouteMapMarker[];
  origin: Coordinates;
  originLabel: string;
  routeGeometry?: Coordinates[];
};

type ProjectedPoint = {
  x: number;
  y: number;
};

const markerStyles: Record<RouteMapMarker["type"], { fill: string; ring: string }> = {
  destination: {
    fill: "#f8d56a",
    ring: "rgba(248, 213, 106, 0.24)",
  },
  nearby: {
    fill: "#ff7d66",
    ring: "rgba(255, 125, 102, 0.22)",
  },
  origin: {
    fill: "#35f6cf",
    ring: "rgba(53, 246, 207, 0.24)",
  },
};

export function RouteMap({
  destination,
  destinationLabel,
  markers = [],
  origin,
  originLabel,
  routeGeometry,
}: RouteMapProps) {
  const routePoints = routeGeometry && routeGeometry.length >= 2 ? routeGeometry : [origin, destination];
  const allCoordinates = [origin, destination, ...routePoints, ...markers.map((marker) => marker.coordinates)];
  const bounds = getBounds(allCoordinates);
  const routePath = routePoints.map((point) => project(point, bounds));
  const projectedOrigin = project(origin, bounds);
  const projectedDestination = project(destination, bounds);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111e] shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(53,246,207,0.16),transparent_28%),radial-gradient(circle_at_78%_70%,rgba(255,125,102,0.14),transparent_30%)]" />
      <svg
        aria-label={`Route map from ${originLabel} to ${destinationLabel}`}
        className="relative h-[25rem] w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 64"
      >
        <defs>
          <linearGradient id="travel-route-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#35f6cf" />
            <stop offset="55%" stopColor="#f8d56a" />
            <stop offset="100%" stopColor="#ff7d66" />
          </linearGradient>
          <filter id="route-glow">
            <feGaussianBlur result="coloredBlur" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: 8 }).map((_, index) => (
          <line
            key={`vertical-${index}`}
            opacity="0.16"
            stroke="#ffffff"
            strokeWidth="0.08"
            x1={index * 14}
            x2={index * 14}
            y1="0"
            y2="64"
          />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <line
            key={`horizontal-${index}`}
            opacity="0.16"
            stroke="#ffffff"
            strokeWidth="0.08"
            x1="0"
            x2="100"
            y1={index * 13}
            y2={index * 13}
          />
        ))}

        <polyline
          fill="none"
          filter="url(#route-glow)"
          points={routePath.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="url(#travel-route-gradient)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.15"
        />

        <Marker point={projectedOrigin} label={originLabel} type="origin" />
        <Marker point={projectedDestination} label={destinationLabel} type="destination" />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            label={marker.label}
            point={project(marker.coordinates, bounds)}
            type={marker.type}
          />
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs text-slate-300 backdrop-blur">
        <span>Origin: {originLabel}</span>
        <span>Destination: {destinationLabel}</span>
      </div>
    </div>
  );
}

function Marker({
  label,
  point,
  type,
}: {
  label: string;
  point: ProjectedPoint;
  type: RouteMapMarker["type"];
}) {
  const style = markerStyles[type];

  return (
    <g>
      <circle cx={point.x} cy={point.y} fill={style.ring} r="3.2" />
      <circle cx={point.x} cy={point.y} fill={style.fill} r={type === "nearby" ? "1.05" : "1.45"} />
      <text
        fill="#f8fafc"
        fontSize={type === "nearby" ? "2.3" : "2.7"}
        fontWeight="800"
        paintOrder="stroke"
        stroke="#020617"
        strokeWidth="0.42"
        x={Math.min(point.x + 2.2, 86)}
        y={Math.max(point.y - 1.8, 4)}
      >
        {label}
      </text>
    </g>
  );
}

function getBounds(coordinates: Coordinates[]) {
  const latitudes = coordinates.map((coordinate) => coordinate.lat);
  const longitudes = coordinates.map((coordinate) => coordinate.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.08);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.08);

  return {
    maxLat: maxLat + latPadding,
    maxLng: maxLng + lngPadding,
    minLat: minLat - latPadding,
    minLng: minLng - lngPadding,
  };
}

function project(
  coordinates: Coordinates,
  bounds: ReturnType<typeof getBounds>,
): ProjectedPoint {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  return {
    x: ((coordinates.lng - bounds.minLng) / lngRange) * 88 + 6,
    y: ((bounds.maxLat - coordinates.lat) / latRange) * 52 + 6,
  };
}
