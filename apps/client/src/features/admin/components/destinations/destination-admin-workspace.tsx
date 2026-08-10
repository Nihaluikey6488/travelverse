"use client";

import { FormEvent, type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  FilePenLine,
  Loader2,
  MapPinned,
  PlusCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import type {
  Attraction,
  Destination,
  DestinationSection,
  UpsertDestinationRequest,
} from "@travelverse/contracts";
import {
  archiveDestination,
  createDestination,
  listAdminDestinations,
  publishDestination,
  updateDestination,
} from "./destination-admin-api";
import { DestinationImportPanel } from "./destination-import-panel";

type FormState = {
  attractionsJson: string;
  bestSeason: string;
  country: string;
  culturalHighlights: string;
  dailyBudget: string;
  danceAndArts: string;
  danceSection: string;
  festivals: string;
  festivalSection: string;
  foodHighlights: string;
  foodSection: string;
  heroImageUrl: string;
  historySection: string;
  lat: string;
  lng: string;
  name: string;
  region: string;
  slug: string;
  status: Destination["status"];
  summary: string;
  tagline: string;
  tags: string;
  travelTipSection: string;
};

const emptyForm: FormState = {
  attractionsJson: "[]",
  bestSeason: "October to March",
  country: "India",
  culturalHighlights: "",
  dailyBudget: "2500",
  danceAndArts: "",
  danceSection: "",
  festivalSection: "",
  festivals: "",
  foodHighlights: "",
  foodSection: "",
  heroImageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  historySection: "",
  lat: "28.6139",
  lng: "77.2090",
  name: "",
  region: "",
  slug: "",
  status: "DRAFT",
  summary: "",
  tagline: "",
  tags: "",
  travelTipSection: "",
};

export function DestinationAdminWorkspace() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Destination["status"] | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => buildPayload(form), [form]);

  useEffect(() => {
    void loadDestinations();
  }, [filterStatus]);

  async function loadDestinations() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listAdminDestinations(filterStatus === "ALL" ? undefined : filterStatus);
      setDestinations(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load destinations.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const payload = buildPayload(form);

      if (selectedSlug) {
        await updateDestination(selectedSlug, payload);
        setMessage(`Updated ${payload.name}`);
      } else {
        await createDestination(payload);
        setMessage(`Created draft ${payload.name}`);
      }

      await loadDestinations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save destination.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(slug: string) {
    if (!window.confirm(`Publish ${slug}? Public users will see it.`)) {
      return;
    }

    await mutateStatus(() => publishDestination(slug), `Published ${slug}`);
  }

  async function handleArchive(slug: string) {
    if (!window.confirm(`Archive ${slug}? Public users will no longer see it.`)) {
      return;
    }

    await mutateStatus(() => archiveDestination(slug), `Archived ${slug}`);
  }

  async function mutateStatus(action: () => Promise<Destination>, successMessage: string) {
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      await loadDestinations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update status.");
    }
  }

  function selectDestination(destination: Destination) {
    setSelectedSlug(destination.slug);
    setForm(toFormState(destination));
    setMessage(`Editing ${destination.name}`);
  }

  function resetForm() {
    setSelectedSlug(null);
    setForm(emptyForm);
    setMessage("Ready to create a new draft.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-teal-200" href="/admin">
              ← Back to admin gate
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              Destination admin
            </h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              Create drafts, edit story/culture/food/travel-tip sections, preview content and
              publish or archive safely. Public APIs still return only published destinations.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950"
            onClick={resetForm}
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
            New draft
          </button>
        </div>

        {message ? (
          <p className="rounded-2xl border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm text-teal-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <DestinationImportPanel onImported={loadDestinations} />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Content queue</h2>
              <div className="flex gap-2">
                <select
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                  onChange={(event) =>
                    setFilterStatus(event.target.value as Destination["status"] | "ALL")
                  }
                  value={filterStatus}
                >
                  {["ALL", "DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"
                  onClick={loadDestinations}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="flex items-center gap-3 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
                  Loading destinations...
                </div>
              ) : null}

              {!isLoading && destinations.length === 0 ? (
                <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-400">
                  No destinations found for this filter.
                </p>
              ) : null}

              {destinations.map((destination) => (
                <article
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                  key={destination.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
                        {destination.status}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{destination.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {destination.region}, {destination.country}
                      </p>
                    </div>
                    <MapPinned className="h-5 w-5 text-orange-300" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-300">{destination.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white"
                      onClick={() => selectDestination(destination)}
                      type="button"
                    >
                      <FilePenLine className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-3 py-2 text-xs font-bold text-slate-950"
                      onClick={() => handlePublish(destination.slug)}
                      type="button"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Publish
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100"
                      onClick={() => handleArchive(destination.slug)}
                      type="button"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">
                  {selectedSlug ? `Editing ${selectedSlug}` : "Create destination draft"}
                </h2>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-300 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-950 disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Slug" name="slug" setForm={setForm} value={form.slug} />
                <Input label="Name" name="name" setForm={setForm} value={form.name} />
                <Input label="Country" name="country" setForm={setForm} value={form.country} />
                <Input label="Region" name="region" setForm={setForm} value={form.region} />
                <Input label="Latitude" name="lat" setForm={setForm} value={form.lat} />
                <Input label="Longitude" name="lng" setForm={setForm} value={form.lng} />
                <Input
                  label="Daily budget INR"
                  name="dailyBudget"
                  setForm={setForm}
                  value={form.dailyBudget}
                />
                <Input label="Best season" name="bestSeason" setForm={setForm} value={form.bestSeason} />
              </div>

              <Input label="Hero image URL" name="heroImageUrl" setForm={setForm} value={form.heroImageUrl} />
              <Textarea label="Tagline" name="tagline" setForm={setForm} value={form.tagline} />
              <Textarea label="Summary" name="summary" setForm={setForm} value={form.summary} />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Cultural highlights comma-separated"
                  name="culturalHighlights"
                  setForm={setForm}
                  value={form.culturalHighlights}
                />
                <Input
                  label="Food highlights comma-separated"
                  name="foodHighlights"
                  setForm={setForm}
                  value={form.foodHighlights}
                />
                <Input
                  label="Dance & arts comma-separated"
                  name="danceAndArts"
                  setForm={setForm}
                  value={form.danceAndArts}
                />
                <Input label="Festivals comma-separated" name="festivals" setForm={setForm} value={form.festivals} />
                <Input label="Tags comma-separated" name="tags" setForm={setForm} value={form.tags} />
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as Destination["status"],
                      }))
                    }
                    value={form.status}
                  >
                    {["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea label="History section" name="historySection" setForm={setForm} value={form.historySection} />
                <Textarea label="Food section" name="foodSection" setForm={setForm} value={form.foodSection} />
                <Textarea label="Dance section" name="danceSection" setForm={setForm} value={form.danceSection} />
                <Textarea label="Festival section" name="festivalSection" setForm={setForm} value={form.festivalSection} />
                <Textarea label="Travel tip section" name="travelTipSection" setForm={setForm} value={form.travelTipSection} />
                <Textarea
                  label="Attractions JSON array"
                  name="attractionsJson"
                  setForm={setForm}
                  value={form.attractionsJson}
                />
              </div>
            </form>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">
                Draft preview
              </p>
              <h3 className="mt-3 text-2xl font-black">{preview.name || "Untitled destination"}</h3>
              <p className="mt-2 text-sm text-slate-300">{preview.summary || "Summary preview..."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {preview.tags.map((tag) => (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  name,
  setForm,
  value,
}: {
  label: string;
  name: keyof FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            [name]: event.target.value,
          }))
        }
        value={value}
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  setForm,
  value,
}: {
  label: string;
  name: keyof FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            [name]: event.target.value,
          }))
        }
        value={value}
      />
    </label>
  );
}

function buildPayload(form: FormState): UpsertDestinationRequest {
  return {
    attractions: parseAttractions(form.attractionsJson),
    bestSeason: form.bestSeason,
    coordinates: {
      lat: Number(form.lat),
      lng: Number(form.lng),
    },
    country: form.country,
    culturalHighlights: parseList(form.culturalHighlights),
    danceAndArts: parseList(form.danceAndArts),
    estimatedDailyBudgetInr: Number(form.dailyBudget),
    festivals: parseList(form.festivals),
    foodHighlights: parseList(form.foodHighlights),
    heroImageUrl: form.heroImageUrl,
    media: [],
    name: form.name,
    region: form.region,
    sections: buildSections(form),
    slug: form.slug,
    sources: [
      {
        fetchedAt: new Date().toISOString(),
        license: "Admin curated content",
        provider: "travelverse-admin",
        sourceUrl: "https://travelverse.local/sources/admin-curated",
        verificationStatus: "VERIFIED",
      },
    ],
    status: form.status,
    summary: form.summary,
    tagline: form.tagline,
    tags: parseList(form.tags),
  };
}

function buildSections(form: FormState): DestinationSection[] {
  return [
    ["History", "history", form.historySection],
    ["Food", "food", form.foodSection],
    ["Dance and arts", "dance", form.danceSection],
    ["Festivals", "festival", form.festivalSection],
    ["Travel tips", "travelTip", form.travelTipSection],
  ]
    .filter(([, , body]) => String(body).trim().length > 0)
    .map(([title, kind, body]) => ({
      body: String(body),
      kind: kind as DestinationSection["kind"],
      title: String(title),
    }));
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAttractions(value: string): Attraction[] {
  try {
    const parsed = JSON.parse(value) as Attraction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toFormState(destination: Destination): FormState {
  const getSection = (kind: DestinationSection["kind"]) =>
    destination.sections.find((section) => section.kind === kind)?.body ?? "";

  return {
    attractionsJson: JSON.stringify(destination.attractions, null, 2),
    bestSeason: destination.bestSeason,
    country: destination.country,
    culturalHighlights: destination.culturalHighlights.join(", "),
    dailyBudget: String(destination.estimatedDailyBudgetInr),
    danceAndArts: destination.danceAndArts.join(", "),
    danceSection: getSection("dance"),
    festivalSection: getSection("festival"),
    festivals: destination.festivals.join(", "),
    foodHighlights: destination.foodHighlights.join(", "),
    foodSection: getSection("food"),
    heroImageUrl: destination.heroImageUrl,
    historySection: getSection("history"),
    lat: String(destination.coordinates.lat),
    lng: String(destination.coordinates.lng),
    name: destination.name,
    region: destination.region,
    slug: destination.slug,
    status: destination.status,
    summary: destination.summary,
    tagline: destination.tagline,
    tags: destination.tags.join(", "),
    travelTipSection: getSection("travelTip"),
  };
}
