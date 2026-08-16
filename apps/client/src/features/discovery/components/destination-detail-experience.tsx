"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Heart,
  IndianRupee,
  Landmark,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { Destination, DestinationSection } from "@travelverse/contracts";
import { ErrorStatePanel } from "@/components/ui/api-state";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { ApiRequestError } from "@/lib/api";
import { getCurrentUser } from "@/features/auth/components/auth-api";
import {
  addFavourite,
  getDestination,
  listFavourites,
  removeFavourite,
} from "./destination-api";
import { RoutePlanner } from "./route-planner";

const sectionLabels: Record<DestinationSection["kind"], string> = {
  culture: "Culture",
  dance: "Dance & arts",
  festival: "Festivals",
  food: "Food",
  history: "History",
  travelTip: "Practical advice",
};

export function DestinationDetailExperience({ slug }: { slug: string }) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    getDestination(slug)
      .then((response) => {
        setDestination(response);
        setError("");
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Destination not found");
      })
      .finally(() => setIsLoading(false));
  }, [slug, retryKey]);

  useEffect(() => {
    getCurrentUser()
      .then(() => {
        setIsAuthenticated(true);
        return listFavourites();
      })
      .then((response) => {
        setIsFavourite(response.destinationSlugs.includes(slug));
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsFavourite(false);
      });
  }, [slug]);

  const sectionGroups = useMemo(() => {
    const grouped = new Map<DestinationSection["kind"], DestinationSection[]>();

    for (const section of destination?.sections ?? []) {
      grouped.set(section.kind, [...(grouped.get(section.kind) ?? []), section]);
    }

    return grouped;
  }, [destination?.sections]);

  async function toggleFavourite() {
    if (!destination) {
      return;
    }

    if (!isAuthenticated) {
      setNotice("Favourite save karne ke liye login required hai. Destination story public hai.");
      return;
    }

    const optimisticValue = !isFavourite;
    setIsFavourite(optimisticValue);

    try {
      const response = optimisticValue
        ? await addFavourite(destination.slug)
        : await removeFavourite(destination.slug);

      setIsFavourite(response.destinationSlugs.includes(destination.slug));
      setNotice(response.isFavourite ? "Saved to favourites." : "Removed from favourites.");
    } catch (requestError: unknown) {
      setIsFavourite(!optimisticValue);

      if (requestError instanceof ApiRequestError && requestError.status === 401) {
        setIsAuthenticated(false);
        setNotice("Session expire ho gayi. Login karke favourite save kar sakte ho.");
        return;
      }

      setNotice(requestError instanceof Error ? requestError.message : "Favourite update failed");
    }
  }

  if (isLoading) {
    return <DestinationDetailSkeleton />;
  }

  if (error || !destination) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <section className="mx-auto grid max-w-3xl gap-5">
          <ErrorStatePanel
            message={error || "This destination is not published yet."}
            onRetry={() => setRetryKey((current) => current + 1)}
            title="Destination not available"
          />
          <Link
            className="mx-auto inline-flex rounded-full bg-teal-300 px-5 py-3 text-sm font-black text-slate-950"
            href="/explore"
          >
            Back to explore
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="award-grain min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,255,209,0.16),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(255,125,102,0.14),transparent_27%),linear-gradient(135deg,#030712,#0a1421_55%,#030712)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-teal-200" href="/explore">
            <HydrationSafeIcon className="h-4 w-4" icon={ArrowLeft} />
            Back to explore
          </Link>
          {!isAuthenticated ? (
            <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white" href="/login">
              Login to save
            </Link>
          ) : null}
        </header>

        <section className="mt-6 overflow-hidden rounded-[2.8rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <div className="relative min-h-[34rem]">
            <Image
              alt={destination.name}
              className="absolute inset-0 h-full w-full object-cover"
              fill
              priority
              sizes="100vw"
              src={destination.heroImageUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/68 to-slate-950/10" />

            <div className="absolute bottom-0 left-0 right-0 grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_22rem] lg:p-10">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/25 bg-teal-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-teal-100 backdrop-blur">
                  <HydrationSafeIcon className="h-4 w-4" icon={MapPinned} />
                  {destination.region}, {destination.country}
                </p>
                <h1 className="mt-5 max-w-4xl text-[clamp(3.2rem,9vw,8rem)] font-black leading-[0.82] tracking-[-0.09em]">
                  {destination.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                  {destination.tagline}
                </p>
              </div>

              <div className="grid content-end gap-3">
                <button
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition ${
                    isFavourite
                      ? "bg-rose-300 text-slate-950"
                      : "border border-white/10 bg-white/[0.08] text-white hover:bg-white hover:text-slate-950"
                  }`}
                  onClick={toggleFavourite}
                  type="button"
                >
                  <HydrationSafeIcon className={isFavourite ? "h-5 w-5 fill-current" : "h-5 w-5"} icon={Heart} />
                  {isFavourite ? "Saved favourite" : "Save favourite"}
                </button>
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Best season
                  </p>
                  <p className="mt-2 text-lg font-black">{destination.bestSeason}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="mt-5 rounded-3xl border border-amber-200/20 bg-amber-200/10 px-5 py-4 text-sm text-amber-50">
            {notice}
          </div>
        ) : null}

        <section className="mt-6 grid gap-5 lg:grid-cols-4">
          <StoryStat
            icon={IndianRupee}
            label="Daily budget"
            value={`₹${destination.estimatedDailyBudgetInr.toLocaleString("en-IN")}`}
          />
          <StoryStat
            icon={Utensils}
            label="Famous food"
            value={destination.foodHighlights.slice(0, 2).join(", ") || "Local food"}
          />
          <StoryStat
            icon={Landmark}
            label="Attractions"
            value={`${destination.attractions.length} mapped places`}
          />
          <StoryStat
            icon={Route}
            label="Coordinates"
            value={`${destination.coordinates.lat.toFixed(2)}, ${destination.coordinates.lng.toFixed(2)}`}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="grid gap-5 self-start">
            <Panel title="Food, dance and festivals">
              <TagCloud title="Food" values={destination.foodHighlights} />
              <TagCloud title="Dance & arts" values={destination.danceAndArts} />
              <TagCloud title="Festivals" values={destination.festivals} />
            </Panel>

            <Panel title="Source trust">
              <div className="grid gap-3">
                {destination.sources.map((source) => (
                  <a
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300 transition hover:border-teal-200/40 hover:text-white"
                    href={source.sourceUrl}
                    key={`${source.provider}-${source.sourceUrl}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="flex items-center gap-2 font-bold text-teal-100">
                      <HydrationSafeIcon className="h-4 w-4" icon={ShieldCheck} />
                      {source.provider} · {source.verificationStatus}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      Open source
                      <HydrationSafeIcon className="h-3.5 w-3.5" icon={ExternalLink} />
                    </span>
                  </a>
                ))}
              </div>
            </Panel>
          </aside>

          <div className="grid gap-6">
            <Panel title="Destination story">
              <p className="text-base leading-8 text-slate-300">{destination.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {destination.tags.map((tag) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300"
                    key={tag}
                  >
                    {toTitle(tag)}
                  </span>
                ))}
              </div>
            </Panel>

            <RoutePlanner
              attractions={destination.attractions}
              destination={destination.coordinates}
              destinationName={destination.name}
            />

            {[...sectionGroups.entries()].map(([kind, sections]) => (
              <Panel key={kind} title={sectionLabels[kind]}>
                <div className="grid gap-4">
                  {sections.map((section) => (
                    <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-5" key={`${section.kind}-${section.title}`}>
                      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-200">
                        <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
                        {sectionLabels[section.kind]}
                      </p>
                      <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                        {section.title}
                      </h3>
                      <p className="mt-3 leading-8 text-slate-300">{section.body}</p>
                    </article>
                  ))}
                </div>
              </Panel>
            ))}

            <Panel title="Attractions">
              <div className="grid gap-4 md:grid-cols-2">
                {destination.attractions.map((attraction) => (
                  <article
                    className="rounded-3xl border border-white/10 bg-slate-950/45 p-5"
                    key={attraction.name}
                  >
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                      <HydrationSafeIcon className="h-4 w-4" icon={Clock3} />
                      {attraction.averageVisitMinutes} min · ₹{attraction.estimatedCostInr}
                    </p>
                    <h3 className="mt-3 text-xl font-black">{attraction.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{attraction.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {attraction.tags.map((tag) => (
                        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300" key={tag}>
                          {toTitle(tag)}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Gallery">
              {destination.media.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {destination.media
                    .filter((media) => media.type === "image")
                    .map((media) => (
                      <figure className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45" key={media.url}>
                        <div className="relative h-64">
                          <Image
                            alt={media.alt}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            src={media.url}
                          />
                        </div>
                        <figcaption className="p-4 text-xs text-slate-400">
                          {media.alt}
                          {media.credit ? ` · ${media.credit}` : ""}
                        </figcaption>
                      </figure>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Gallery assets can be added from admin import/editor.</p>
              )}
            </Panel>
          </div>
        </section>
      </section>
    </main>
  );
}

function StoryStat({
  icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        <HydrationSafeIcon className="h-4 w-4 text-teal-200" icon={icon} />
        {label}
      </p>
      <p className="mt-3 text-lg font-black">{value}</p>
    </div>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TagCloud({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300" key={value}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function DestinationDetailSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto max-w-7xl animate-pulse">
        <div className="h-6 w-40 rounded-full bg-white/10" />
        <div className="mt-6 h-[34rem] rounded-[2.8rem] bg-white/10" />
        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-28 rounded-[1.6rem] bg-white/10" key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
