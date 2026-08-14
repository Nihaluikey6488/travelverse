"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Heart,
  IndianRupee,
  MapPinned,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from "lucide-react";
import type {
  Destination,
  DestinationFacetResponse,
  DestinationListResponse,
} from "@travelverse/contracts";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { ApiRequestError } from "@/lib/api";
import { getCurrentUser } from "@/features/auth/components/auth-api";
import {
  addFavourite,
  getDestinationFacets,
  listDestinations,
  listFavourites,
  removeFavourite,
} from "./destination-api";

const pageSize = 6;

const emptyFacets: DestinationFacetResponse = {
  activities: [],
  categories: [],
  countries: [],
  regions: [],
  tags: [],
};

export function ExploreExperience() {
  const [activity, setActivity] = useState("");
  const [category, setCategory] = useState("");
  const [destinationList, setDestinationList] = useState<DestinationListResponse | null>(null);
  const [facets, setFacets] = useState<DestinationFacetResponse>(emptyFacets);
  const [favouriteSlugs, setFavouriteSlugs] = useState<Set<string>>(() => new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");

  const activeFilters = useMemo(
    () => [region, category, activity].filter(Boolean),
    [activity, category, region],
  );

  useEffect(() => {
    getDestinationFacets()
      .then(setFacets)
      .catch(() => setFacets(emptyFacets));

    getCurrentUser()
      .then(() => {
        setIsAuthenticated(true);
        return listFavourites();
      })
      .then((response) => {
        setFavouriteSlugs(new Set(response.destinationSlugs));
      })
      .catch(() => {
        setIsAuthenticated(false);
        setFavouriteSlugs(new Set());
      });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      listDestinations({
        activity: activity || undefined,
        category: category || undefined,
        limit: pageSize,
        page,
        region: region || undefined,
        search: query.trim() || undefined,
      })
        .then((response) => {
          setDestinationList(response);
          setNotice("");
        })
        .catch((error: unknown) => {
          setDestinationList(null);
          setNotice(error instanceof Error ? error.message : "Unable to load destinations");
        })
        .finally(() => setIsLoading(false));
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [activity, category, page, query, region]);

  function resetFilters() {
    setActivity("");
    setCategory("");
    setPage(1);
    setQuery("");
    setRegion("");
  }

  async function toggleFavourite(destinationSlug: string) {
    if (!isAuthenticated) {
      setNotice("Favourite save karne ke liye login required hai. Explore public hai.");
      return;
    }

    const isFavourite = favouriteSlugs.has(destinationSlug);
    const nextSlugs = new Set(favouriteSlugs);

    if (isFavourite) {
      nextSlugs.delete(destinationSlug);
    } else {
      nextSlugs.add(destinationSlug);
    }

    setFavouriteSlugs(nextSlugs);

    try {
      const response = isFavourite
        ? await removeFavourite(destinationSlug)
        : await addFavourite(destinationSlug);

      setFavouriteSlugs(new Set(response.destinationSlugs));
      setNotice(response.isFavourite ? "Saved to favourites." : "Removed from favourites.");
    } catch (error: unknown) {
      setFavouriteSlugs(favouriteSlugs);

      if (error instanceof ApiRequestError && error.status === 401) {
        setIsAuthenticated(false);
        setNotice("Session expire ho gayi. Login karke favourite save kar sakte ho.");
        return;
      }

      setNotice(error instanceof Error ? error.message : "Favourite update failed");
    }
  }

  const destinations = destinationList?.data ?? [];
  const meta = destinationList?.meta;
  const totalPages = meta?.totalPages ?? 0;

  return (
    <main className="award-grain min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(45,255,209,0.18),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(255,125,102,0.18),transparent_28%),linear-gradient(135deg,#030712,#08111e_48%,#030712)]" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] backdrop-blur-xl"
            href="/"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-300 text-slate-950">
              TV
            </span>
            TravelVerse
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
            <Link className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white" href="/">
              Home
            </Link>
            <Link
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
              href="/account"
            >
              Account
            </Link>
            <Link
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
              href="/admin"
            >
              Admin
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
              <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
              Day 6 discovery
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.6rem,7vw,6.6rem)] font-black leading-[0.86] tracking-[-0.08em]">
              Search less.
              <span className="block bg-gradient-to-r from-teal-200 via-amber-100 to-orange-300 bg-clip-text text-transparent">
                Feel the place.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Find destinations by region, activity, category, local food and cultural story. Login
              only when you want to save favourites.
            </p>
          </div>

          <div className="grid gap-4 self-end">
            <label className="flex items-center gap-3 rounded-[1.6rem] border border-white/10 bg-slate-950/70 px-4 py-3 shadow-inner shadow-black/40">
              <HydrationSafeIcon className="h-5 w-5 text-teal-200" icon={Search} />
              <input
                aria-label="Search destinations"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:text-base"
                onChange={(event) => {
                  setPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Search food, beaches, history, Jaipur..."
                value={query}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <FilterSelect
                label="Region"
                onChange={setRegion}
                options={facets.regions}
                value={region}
              />
              <FilterSelect
                label="Category"
                onChange={setCategory}
                options={facets.categories}
                value={category}
              />
              <FilterSelect
                label="Activity"
                onChange={setActivity}
                options={facets.activities}
                value={activity}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-2">
                <HydrationSafeIcon className="h-4 w-4 text-amber-200" icon={SlidersHorizontal} />
                {activeFilters.length || query ? "Filtered discovery" : "All published places"}
              </span>
              {activeFilters.length || query ? (
                <button
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-100 hover:border-teal-200/60"
                  onClick={resetFilters}
                  type="button"
                >
                  Reset filters
                </button>
              ) : null}
              {!isAuthenticated ? (
                <Link className="text-teal-200 hover:text-white" href="/login">
                  Login to save favourites
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-3xl border border-amber-200/20 bg-amber-200/10 px-5 py-4 text-sm text-amber-50">
            {notice}
          </div>
        ) : null}

        <section aria-live="polite" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-200">
                Published atlas
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                {meta
                  ? `${meta.total} destination${meta.total === 1 ? "" : "s"} found`
                  : "Loading destinations"}
              </h2>
            </div>
            {meta ? (
              <p className="text-sm text-slate-400">
                Page {meta.page} of {Math.max(meta.totalPages, 1)}
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: pageSize }).map((_, index) => (
                <DestinationCardSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!isLoading && destinations.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {destinations.map((destination) => (
                <DestinationExploreCard
                  destination={destination}
                  isFavourite={favouriteSlugs.has(destination.slug)}
                  key={destination.id}
                  onToggleFavourite={toggleFavourite}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && destinations.length === 0 ? (
            <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.06] p-10 text-center shadow-2xl shadow-black/25">
              <HydrationSafeIcon className="mx-auto h-10 w-10 text-teal-200" icon={Compass} />
              <h3 className="mt-4 text-2xl font-black">No published destination found</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">
                Explore searches only published atlas data. Try Jaipur, Goa, Varanasi, food, history
                or beach — or import a new city from the admin workspace first.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  className="rounded-full bg-teal-300 px-5 py-3 text-sm font-black text-slate-950"
                  onClick={resetFilters}
                  type="button"
                >
                  Clear search
                </button>
                <Link
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-teal-200/50 hover:bg-teal-200/10"
                  href="/admin/destinations"
                >
                  Import new city
                </Link>
              </div>
            </div>
          ) : null}

          {meta && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                type="button"
              >
                <HydrationSafeIcon className="h-4 w-4" icon={ArrowLeft} />
                Previous
              </button>
              <span className="rounded-full bg-white/[0.07] px-4 py-3 text-sm text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                type="button"
              >
                Next
                <HydrationSafeIcon className="h-4 w-4" icon={ArrowRight} />
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
      <select
        className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-teal-200/70"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {toTitle(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DestinationExploreCard({
  destination,
  isFavourite,
  onToggleFavourite,
}: {
  destination: Destination;
  isFavourite: boolean;
  onToggleFavourite: (destinationSlug: string) => void;
}) {
  const leadingFood = destination.foodHighlights[0] ?? "Local food";

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-teal-200/40">
      <div className="relative min-h-64 overflow-hidden">
        <Image
          alt={destination.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          src={destination.heroImageUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <button
          aria-label={
            isFavourite ? `Remove ${destination.name} from favourites` : `Save ${destination.name}`
          }
          className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border backdrop-blur-xl transition ${
            isFavourite
              ? "border-rose-200/60 bg-rose-300 text-slate-950"
              : "border-white/15 bg-black/30 text-white hover:bg-white hover:text-slate-950"
          }`}
          onClick={() => onToggleFavourite(destination.slug)}
          type="button"
        >
          <HydrationSafeIcon
            className={isFavourite ? "h-5 w-5 fill-current" : "h-5 w-5"}
            icon={Heart}
          />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-teal-100 backdrop-blur-md">
            <HydrationSafeIcon className="h-3.5 w-3.5" icon={MapPinned} />
            {destination.region}
          </p>
          <h3 className="mt-3 text-4xl font-black leading-none tracking-[-0.07em]">
            {destination.name}
          </h3>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <p className="line-clamp-2 text-sm leading-7 text-slate-300">{destination.summary}</p>

        <div className="grid grid-cols-2 gap-3">
          <MiniStat
            icon={IndianRupee}
            label="Daily cost"
            value={`₹${destination.estimatedDailyBudgetInr.toLocaleString("en-IN")}`}
          />
          <MiniStat icon={Utensils} label="Famous food" value={leadingFood} />
        </div>

        <div className="flex flex-wrap gap-2">
          {destination.tags.slice(0, 4).map((tag) => (
            <span
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300"
              key={tag}
            >
              {toTitle(tag)}
            </span>
          ))}
        </div>

        <Link
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white"
          href={`/destinations/${destination.slug}`}
        >
          Open destination story
          <HydrationSafeIcon className="h-4 w-4" icon={ArrowRight} />
        </Link>
      </div>
    </article>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
      <p className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.17em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5 text-teal-200" icon={icon} />
        {label}
      </p>
      <p className="mt-2 line-clamp-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function DestinationCardSkeleton() {
  return (
    <div className="min-h-[29rem] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="h-56 rounded-[1.5rem] bg-white/10" />
      <div className="mt-5 h-4 w-3/4 rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-full rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-2/3 rounded-full bg-white/10" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
