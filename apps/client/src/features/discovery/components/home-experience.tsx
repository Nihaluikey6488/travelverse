"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Compass, Hotel, Plane, Route, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { sampleDestinations } from "@travelverse/contracts";
import type { Destination } from "@travelverse/contracts";
import type { TravelGlobeProps } from "@/components/three/travel-globe";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { DestinationPostcard } from "./destination-postcard";
import { GlobeFallback } from "./globe-fallback";
import { useScenePreferences } from "./use-scene-preferences";

const TravelGlobe = dynamic<TravelGlobeProps>(
  () => import("@/components/three/travel-globe").then((mod) => mod.TravelGlobe),
  {
    ssr: false,
    loading: () => <GlobeLoadingShell label="Loading WebGL atlas" />,
  },
);

const featurePills = [
  { icon: Compass, label: "Explore story" },
  { icon: Route, label: "Route map" },
  { icon: Plane, label: "Cost compare" },
  { icon: Hotel, label: "Stay planner" },
];

export function HomeExperience() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(sampleDestinations[0]?.slug ?? "");
  const scenePreferences = useScenePreferences();
  const { scrollYProgress } = useScroll();
  const globeOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.78, 0.52]);
  const globeScale = useTransform(scrollYProgress, [0, 0.65], [1, 0.92]);

  const destinations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sampleDestinations;
    }

    return sampleDestinations.filter((destination) => {
      const haystack = [
        destination.name,
        destination.region,
        destination.country,
        destination.tagline,
        ...destination.tags,
        ...destination.culturalHighlights,
        ...destination.foodHighlights,
        ...destination.danceAndArts,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  const selectedDestination =
    sampleDestinations.find((destination) => destination.slug === selectedSlug) ??
    sampleDestinations[0];

  function selectDestination(slug: string) {
    setSelectedSlug(slug);
  }

  return (
    <main className="award-grain relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(45,255,209,0.22),transparent_30%),radial-gradient(circle_at_30%_78%,rgba(255,125,102,0.18),transparent_28%),linear-gradient(110deg,rgba(3,7,18,0.2),rgba(3,7,18,0.88)_52%,#030712)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:78px_78px] opacity-20" />

      <motion.section
        aria-label="Interactive travel globe"
        className="pointer-events-none fixed inset-y-0 right-0 w-full lg:pointer-events-auto lg:w-[62vw]"
        style={{ opacity: globeOpacity, scale: globeScale }}
      >
        {!scenePreferences.hasHydrated ? (
          <GlobeLoadingShell label="Preparing visual mode" />
        ) : scenePreferences.shouldUseFallback ? (
          <GlobeFallback
            destinations={sampleDestinations}
            onSelectDestination={selectDestination}
            reason={scenePreferences.fallbackReason}
            reduceMotion={scenePreferences.prefersReducedMotion}
            selectedSlug={selectedSlug}
          />
        ) : (
          <TravelGlobe
            destinations={sampleDestinations}
            onSelectDestination={selectDestination}
            quality={scenePreferences.quality}
            reducedMotion={scenePreferences.prefersReducedMotion}
            selectedSlug={selectedSlug}
          />
        )}
      </motion.section>

      <section className="relative z-10 flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-950/40 backdrop-blur-xl"
            href="/"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-300 text-slate-950 transition-transform group-hover:rotate-12">
              TV
            </span>
            TravelVerse
          </Link>

          <nav
            className="hidden rounded-full border border-white/10 bg-white/[0.055] px-2 py-2 text-sm text-slate-300 backdrop-blur-xl md:flex"
            aria-label="Primary"
          >
            {[
              ["Explore", "/explore"],
              ["Routes", "/transport"],
              ["Hotels", "/hotels"],
              ["Login", "/login"],
              ["Admin", "/admin"],
            ].map(([label, href]) => (
              <Link
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="grid flex-1 items-end gap-8 pb-8 pt-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.52fr)] lg:pt-0">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-teal-100">
              <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
              Cinematic destination atlas
            </p>
            <h1 className="max-w-5xl text-[clamp(3.2rem,10vw,8.8rem)] font-black leading-[0.82] tracking-[-0.09em] text-white">
              Spin the world.
              <span className="block bg-gradient-to-r from-teal-200 via-amber-100 to-orange-300 bg-clip-text text-transparent">
                Enter the story.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Search places like a map, but explore them like a travel film — routes, cost, culture,
              food, festivals and hotel planning in one immersive flow.
            </p>

            <div className="mt-8 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.08] p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <label className="flex items-center gap-3 rounded-[1.55rem] bg-slate-950/70 px-4 py-3">
                <HydrationSafeIcon
                  aria-hidden="true"
                  className="h-5 w-5 text-teal-200"
                  icon={Search}
                />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:text-base"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Jaipur, food, beaches, history..."
                  aria-label="Search destinations"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {featurePills.map(({ icon: Icon, label }) => (
                <button
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:-translate-y-1 hover:border-teal-200/50 hover:bg-teal-200/10 hover:text-white"
                  key={label}
                  type="button"
                >
                  <HydrationSafeIcon
                    className="h-4 w-4 text-amber-200 transition group-hover:text-teal-200"
                    icon={Icon}
                  />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {selectedDestination ? <DestinationConsole destination={selectedDestination} /> : null}
        </div>

        <motion.section
          aria-label="Featured destination postcards"
          className="relative z-10 pb-5"
          initial={{ opacity: 0, y: 44 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, margin: "-15%" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-teal-200">
                Floating postcards
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                Pick a city by feeling, not just by name.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Hover cards for depth, shine and travel stats. Click any postcard to lock the
              destination signal on the globe.
            </p>
          </div>

          {destinations.length > 0 ? (
            <div className="grid gap-5 [perspective:1600px] md:grid-cols-3">
              {destinations.map((destination, index) => (
                <DestinationPostcard
                  destination={destination}
                  index={index}
                  isSelected={destination.slug === selectedSlug}
                  key={destination.id}
                  onSelect={selectDestination}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center text-slate-300 backdrop-blur-xl">
              No postcards match this search yet.
            </div>
          )}
        </motion.section>
      </section>
    </main>
  );
}

function GlobeLoadingShell({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="relative grid h-48 w-48 place-items-center">
        <div className="absolute inset-0 animate-ping rounded-full border border-teal-200/30" />
        <div className="absolute inset-6 rounded-full border border-amber-200/20" />
        <div className="grid h-24 w-24 place-items-center rounded-full bg-teal-200 text-slate-950 shadow-2xl shadow-teal-950/50">
          <HydrationSafeIcon className="h-8 w-8" icon={Compass} />
        </div>
        <p className="absolute -bottom-8 text-[0.68rem] font-black uppercase tracking-[0.24em] text-teal-100">
          {label}
        </p>
      </div>
    </div>
  );
}

function DestinationConsole({ destination }: { destination: Destination }) {
  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="rounded-[2.2rem] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:self-end"
      initial={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Live destination signal
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">{destination.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {destination.region}, {destination.country}
          </p>
        </div>
        <Link
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition hover:rotate-12"
          href="/explore"
          aria-label={`Explore ${destination.name}`}
        >
          <HydrationSafeIcon className="h-5 w-5" icon={ArrowUpRight} />
        </Link>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-300">{destination.summary}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Daily cost</dt>
          <dd className="mt-2 text-xl font-black">
            ₹{destination.estimatedDailyBudgetInr.toLocaleString("en-IN")}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Best season</dt>
          <dd className="mt-2 text-sm font-bold leading-6">{destination.bestSeason}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {[...destination.foodHighlights.slice(0, 2), ...destination.danceAndArts.slice(0, 1)].map(
          (highlight) => (
            <span
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300"
              key={highlight}
            >
              {highlight}
            </span>
          ),
        )}
      </div>
    </motion.aside>
  );
}
