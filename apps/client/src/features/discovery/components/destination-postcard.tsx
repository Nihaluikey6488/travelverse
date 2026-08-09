"use client";

import { motion } from "framer-motion";
import { Clock3, IndianRupee, MapPinned, Navigation2, Utensils } from "lucide-react";
import { useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import type { Destination } from "@travelverse/contracts";

type DestinationPostcardProps = {
  destination: Destination;
  index: number;
  isSelected: boolean;
  onSelect: (slug: string) => void;
};

type TiltState = {
  glareX: number;
  glareY: number;
  rotateX: number;
  rotateY: number;
};

type PostcardStyle = CSSProperties & {
  "--glare-x": string;
  "--glare-y": string;
};

const neutralTilt: TiltState = {
  glareX: 50,
  glareY: 50,
  rotateX: 0,
  rotateY: 0,
};

const delhiGateway = {
  lat: 28.6139,
  lng: 77.209,
};

export function DestinationPostcard({
  destination,
  index,
  isSelected,
  onSelect,
}: DestinationPostcardProps) {
  const [tilt, setTilt] = useState<TiltState>(neutralTilt);
  const routeDistanceKm = useMemo(
    () =>
      getDistanceKm(delhiGateway, {
        lat: destination.coordinates.lat,
        lng: destination.coordinates.lng,
      }),
    [destination.coordinates.lat, destination.coordinates.lng],
  );
  const famousFood =
    destination.foodHighlights[0] ?? destination.culturalHighlights[0] ?? "Local experience";
  const cardStyle: PostcardStyle = {
    "--glare-x": `${tilt.glareX}%`,
    "--glare-y": `${tilt.glareY}%`,
    transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(${
      isSelected ? "-10px" : "0"
    })`,
  };

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    setTilt({
      glareX: x * 100,
      glareY: y * 100,
      rotateX: (0.5 - y) * 14,
      rotateY: (x - 0.5) * 16,
    });
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group relative [perspective:1400px]"
      initial={{ opacity: 0, y: 28 }}
      transition={{ delay: 0.1 * index, duration: 0.65, ease: "easeOut" }}
    >
      <button
        aria-label={`Select ${destination.name}`}
        aria-pressed={isSelected}
        className={`relative min-h-[26rem] w-full overflow-hidden rounded-[2.25rem] border p-0 text-left shadow-2xl outline-none transition duration-300 [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-teal-200 ${
          isSelected
            ? "border-teal-200/80 shadow-teal-950/70"
            : "border-white/10 shadow-black/35 hover:border-white/30"
        }`}
        onClick={() => onSelect(destination.slug)}
        onPointerLeave={() => setTilt(neutralTilt)}
        onPointerMove={handlePointerMove}
        style={cardStyle}
        type="button"
      >
        <div
          className="absolute -inset-6 scale-110 bg-cover bg-center transition duration-700 group-hover:scale-[1.18] [transform:translateZ(-34px)]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(3,7,18,0.02), rgba(3,7,18,0.82)), url(${destination.heroImageUrl})`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.24),transparent_25%),linear-gradient(180deg,rgba(3,7,18,0.05),rgba(3,7,18,0.93)_82%)]" />
        <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(circle_at_var(--glare-x)_var(--glare-y),rgba(255,255,255,0.34),transparent_28%)]" />
        <div className="absolute left-5 top-5 h-24 w-24 rounded-full border border-white/15 bg-white/[0.08] blur-sm [transform:translateZ(22px)]" />

        <div className="relative flex min-h-[26rem] flex-col justify-between p-5 [transform-style:preserve-3d]">
          <div className="flex items-start justify-between gap-4 [transform:translateZ(58px)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.2em] text-teal-100 backdrop-blur-md">
              <MapPinned className="h-3.5 w-3.5" />
              {destination.region}
            </span>
            <span className="grid h-14 w-14 rotate-6 place-items-center rounded-2xl border border-amber-100/40 bg-amber-100/15 text-center text-[0.62rem] font-black uppercase leading-3 tracking-[0.16em] text-amber-100 backdrop-blur-md [transform:translateZ(78px)]">
              Card
              <br />0{index + 1}
            </span>
          </div>

          <div className="[transform:translateZ(72px)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-200">
              {destination.country}
            </p>
            <h2 className="mt-2 text-5xl font-black leading-[0.86] tracking-[-0.09em] text-white drop-shadow-2xl">
              {destination.name}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-200/90">{destination.tagline}</p>
          </div>

          <div className="grid gap-2 [transform:translateZ(52px)]">
            <div className="grid grid-cols-2 gap-2">
              <PostcardStat icon={Utensils} label="Famous bite" value={famousFood} />
              <PostcardStat icon={Clock3} label="Best season" value={destination.bestSeason} />
              <PostcardStat
                icon={IndianRupee}
                label="Daily cost"
                value={`Rs ${destination.estimatedDailyBudgetInr.toLocaleString("en-IN")}`}
              />
              <PostcardStat
                icon={Navigation2}
                label="Route"
                value={`${routeDistanceKm.toLocaleString("en-IN")} km from Delhi`}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold text-slate-200 backdrop-blur-md">
              <span>{isSelected ? "Synced with globe" : "Click to sync globe"}</span>
              <span className={isSelected ? "text-teal-200" : "text-slate-400"}>
                {isSelected ? "ACTIVE" : "EXPLORE"}
              </span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function PostcardStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Utensils;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-teal-200" />
        {label}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-white">{value}</p>
    </div>
  );
}

function getDistanceKm(
  from: {
    lat: number;
    lng: number;
  },
  to: {
    lat: number;
    lng: number;
  },
) {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(earthRadiusKm * angularDistance);
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
