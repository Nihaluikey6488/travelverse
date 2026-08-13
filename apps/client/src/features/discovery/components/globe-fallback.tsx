"use client";

import { motion } from "framer-motion";
import { Compass, MapPin, Route, Sparkles } from "lucide-react";
import type { Destination } from "@travelverse/contracts";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";

type GlobeFallbackProps = {
  destinations: Destination[];
  onSelectDestination: (slug: string) => void;
  reason: string;
  reduceMotion: boolean;
  selectedSlug: string;
};

const fallbackPositions = [
  { left: "54%", top: "16%" },
  { left: "72%", top: "42%" },
  { left: "48%", top: "68%" },
  { left: "28%", top: "52%" },
  { left: "32%", top: "24%" },
];

export function GlobeFallback({
  destinations,
  onSelectDestination,
  reason,
  reduceMotion,
  selectedSlug,
}: GlobeFallbackProps) {
  const selectedDestination =
    destinations.find((destination) => destination.slug === selectedSlug) ?? destinations[0];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(45,255,209,0.24),transparent_28%),radial-gradient(circle_at_68%_64%,rgba(248,213,106,0.16),transparent_24%)]" />
      <div className="absolute h-[min(76vw,620px)] w-[min(76vw,620px)] rounded-full border border-teal-100/10 bg-slate-900/30 shadow-[0_0_110px_rgba(45,255,209,0.16)] backdrop-blur-sm" />
      <div className="absolute h-[min(58vw,470px)] w-[min(58vw,470px)] rounded-full border border-dashed border-teal-100/20" />
      <div className="absolute h-[min(42vw,340px)] w-[min(42vw,340px)] rounded-full border border-amber-100/15" />

      <motion.div
        animate={reduceMotion ? undefined : { rotate: 360 }}
        className="absolute h-[min(68vw,550px)] w-[min(68vw,550px)] rounded-full border border-transparent border-t-teal-200/40"
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        animate={reduceMotion ? undefined : { rotate: -360 }}
        className="absolute h-[min(50vw,410px)] w-[min(50vw,410px)] rounded-full border border-transparent border-b-amber-200/35"
        transition={{ duration: 24, ease: "linear", repeat: Infinity }}
      />

      <motion.div
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        className="relative grid h-[min(58vw,470px)] w-[min(58vw,470px)] place-items-center rounded-full border border-white/10 bg-slate-950/45 shadow-2xl shadow-black/40 backdrop-blur-xl"
        initial={reduceMotion ? undefined : { opacity: 0.72, scale: 0.96 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <div className="max-w-[230px] px-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-200 text-slate-950 shadow-lg shadow-teal-950/40">
            <HydrationSafeIcon className="h-6 w-6" icon={Compass} />
          </span>
          <p className="mt-4 text-[0.65rem] font-black uppercase tracking-[0.24em] text-teal-100">
            {reason}
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white">
            {selectedDestination?.name ?? "TravelVerse"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Essential discovery stays usable even when WebGL is skipped.
          </p>
        </div>

        {destinations.map((destination, index) => {
          const position = fallbackPositions[index % fallbackPositions.length];
          const isSelected = destination.slug === selectedSlug;

          return (
            <motion.button
              animate={reduceMotion ? undefined : { opacity: 1, scale: isSelected ? 1.08 : 1 }}
              className={[
                "absolute z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-black shadow-xl backdrop-blur-xl transition",
                isSelected
                  ? "border-amber-200/60 bg-amber-200 text-slate-950"
                  : "border-white/10 bg-white/10 text-white hover:border-teal-200/60 hover:bg-teal-200/15",
              ].join(" ")}
              initial={reduceMotion ? undefined : { opacity: 0, scale: 0.86 }}
              key={destination.slug}
              onClick={() => onSelectDestination(destination.slug)}
              style={{ left: position.left, top: position.top }}
              transition={{ delay: 0.08 * index, duration: 0.45, ease: "easeOut" }}
              type="button"
              whileHover={reduceMotion ? undefined : { y: -4 }}
            >
              <HydrationSafeIcon className="h-4 w-4" icon={MapPin} />
              {destination.name}
            </motion.button>
          );
        })}
      </motion.div>

      <div className="absolute bottom-6 left-1/2 z-10 flex w-[min(92vw,620px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-bold text-slate-300 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <span className="inline-flex items-center gap-2 text-teal-100">
          <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
          Performance safe
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-500" />
        <span className="inline-flex items-center gap-2">
          <HydrationSafeIcon className="h-4 w-4 text-amber-200" icon={Route} />
          Routes, cards and search still active
        </span>
      </div>
    </div>
  );
}
