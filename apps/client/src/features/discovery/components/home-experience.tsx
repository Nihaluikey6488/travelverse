"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Compass, Hotel, MapPinned, Plane, Route, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { sampleDestinations } from "@travelverse/contracts";

const TravelGlobe = dynamic(
  () => import("@/components/three/travel-globe").then((mod) => mod.TravelGlobe),
  {
    ssr: false,
    loading: () => <div className="scene-loading" />,
  },
);

export function HomeExperience() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(sampleDestinations[0]?.slug ?? "");

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
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  const selectedDestination =
    sampleDestinations.find((destination) => destination.slug === selectedSlug) ??
    sampleDestinations[0];

  return (
    <main className="experience-shell">
      <section className="globe-stage" aria-label="Animated travel globe">
        <TravelGlobe />
      </section>

      <section className="workspace">
        <div className="brand-row">
          <Link href="/" className="brand-mark" aria-label="TravelVerse home">
            TV
          </Link>
          <nav className="top-nav" aria-label="Primary">
            <Link href="/explore">Explore</Link>
            <Link href="/trip-planner">Planner</Link>
            <Link href="/transport">Routes</Link>
            <Link href="/hotels">Hotels</Link>
            <Link href="/login">Login</Link>
            <Link href="/account">Account</Link>
          </nav>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">TravelVerse 3D</p>
          <h1>Find a place by story, route, culture and cost.</h1>
        </div>

        <div className="search-bar">
          <Search size={20} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Jaipur, food, beaches, history..."
            aria-label="Search destinations"
          />
        </div>

        <div className="action-row" aria-label="Planning modes">
          <button type="button">
            <Compass size={18} aria-hidden="true" />
            Explore
          </button>
          <button type="button">
            <Route size={18} aria-hidden="true" />
            Route
          </button>
          <button type="button">
            <Plane size={18} aria-hidden="true" />
            Cost
          </button>
          <button type="button">
            <Hotel size={18} aria-hidden="true" />
            Stay
          </button>
        </div>

        {selectedDestination ? (
          <section className="destination-focus" aria-label="Selected destination">
            <div>
              <p className="region-line">
                {selectedDestination.region}, {selectedDestination.country}
              </p>
              <h2>{selectedDestination.name}</h2>
              <p>{selectedDestination.summary}</p>
            </div>
            <dl className="stat-grid">
              <div>
                <dt>Daily budget</dt>
                <dd>Rs {selectedDestination.estimatedDailyBudgetInr.toLocaleString("en-IN")}</dd>
              </div>
              <div>
                <dt>Best season</dt>
                <dd>{selectedDestination.bestSeason}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="destination-grid" aria-label="Featured destinations">
          {destinations.map((destination) => (
            <button
              className={
                destination.slug === selectedSlug ? "destination-card active" : "destination-card"
              }
              key={destination.id}
              onClick={() => setSelectedSlug(destination.slug)}
              type="button"
            >
              <span>
                <MapPinned size={18} aria-hidden="true" />
                {destination.name}
              </span>
              <small>{destination.culturalHighlights.slice(0, 3).join(" / ")}</small>
            </button>
          ))}
        </section>
      </section>
    </main>
  );
}
