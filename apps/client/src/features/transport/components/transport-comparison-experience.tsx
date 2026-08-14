"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CalendarDays,
  Car,
  Clock3,
  IndianRupee,
  Plane,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Train,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  TransportComparisonOption,
  TransportComparisonRequest,
  TransportComparisonResponse,
  TransportMode,
  TransportPriceSource,
} from "@travelverse/contracts";
import { sampleDestinations } from "@travelverse/contracts";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { compareTransport } from "./transport-api";

type FormState = {
  adults: number;
  children: number;
  departureDate: string;
  destination: string;
  origin: string;
  returnDate: string;
};

const defaultFormState: FormState = {
  adults: 2,
  children: 0,
  departureDate: "2026-08-20",
  destination: sampleDestinations[0]?.name ?? "Jaipur",
  origin: "Delhi",
  returnDate: "2026-08-23",
};

const destinationSuggestions = [
  ...new Set([
    "Jaipur",
    "Goa",
    "Varanasi",
    "Manali",
    ...sampleDestinations.map((item) => item.name),
  ]),
];

const sourceCopy: Record<TransportPriceSource, { className: string; label: string }> = {
  ESTIMATED: {
    className: "border-amber-200/25 bg-amber-200/10 text-amber-100",
    label: "ESTIMATED",
  },
  LIVE: {
    className: "border-emerald-200/30 bg-emerald-200/10 text-emerald-100",
    label: "LIVE",
  },
  SANDBOX: {
    className: "border-sky-200/30 bg-sky-200/10 text-sky-100",
    label: "SANDBOX",
  },
};

const modeMeta: Record<TransportMode, { icon: typeof Plane; label: string }> = {
  bus: { icon: Bus, label: "Bus" },
  car: { icon: Car, label: "Drive" },
  flight: { icon: Plane, label: "Flight" },
  rail: { icon: Train, label: "Rail" },
};

export function TransportComparisonExperience() {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [response, setResponse] = useState<TransportComparisonResponse | null>(null);

  const selectedTags = useMemo(() => {
    if (!response) {
      return new Map<string, string[]>();
    }

    const tags = new Map<string, string[]>();
    addTag(tags, response.recommendations.cheapestOptionId, "Cheapest");
    addTag(tags, response.recommendations.fastestOptionId, "Fastest");
    addTag(tags, response.recommendations.recommendedOptionId, "Recommended");

    return tags;
  }, [response]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNotice("");

    try {
      const payload = toTransportPayload(formState);
      const comparison = await compareTransport(payload);
      setResponse(comparison);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Unable to compare transport options");
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm<TField extends keyof FormState>(field: TField, value: FormState[TField]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="award-grain min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(45,255,209,0.18),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(255,125,102,0.16),transparent_28%),linear-gradient(135deg,#030712,#08111e_50%,#030712)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />

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
              href="/explore"
            >
              Explore
            </Link>
            <Link
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
              href="/admin"
            >
              Admin
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
              <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
              Day 9 cost intelligence
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.6rem,7vw,6.4rem)] font-black leading-[0.86] tracking-[-0.08em]">
              Compare the route.
              <span className="block bg-gradient-to-r from-teal-200 via-amber-100 to-orange-300 bg-clip-text text-transparent">
                Trust the label.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Flights, rail, bus and road-trip estimates are normalized in one place with clear
              LIVE, SANDBOX or ESTIMATED labels. No fake certainty, no hidden planning math.
            </p>
          </div>

          <form className="grid gap-4 self-end" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Origin"
                onChange={(value) => updateForm("origin", value)}
                placeholder="Delhi"
                value={formState.origin}
              />
              <TextField
                label="Destination"
                list="destination-suggestions"
                onChange={(value) => updateForm("destination", value)}
                placeholder="Jaipur"
                value={formState.destination}
              />
              <datalist id="destination-suggestions">
                {destinationSuggestions.map((destination) => (
                  <option key={destination} value={destination} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                label="Departure"
                onChange={(value) => updateForm("departureDate", value)}
                value={formState.departureDate}
              />
              <DateField
                label="Return"
                onChange={(value) => updateForm("returnDate", value)}
                value={formState.returnDate}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Adults"
                max={9}
                min={1}
                onChange={(value) => updateForm("adults", value)}
                value={formState.adults}
              />
              <NumberField
                label="Children"
                max={9}
                min={0}
                onChange={(value) => updateForm("children", value)}
                value={formState.children}
              />
            </div>

            <button
              className="group inline-flex items-center justify-center gap-3 rounded-[1.45rem] bg-teal-200 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-2xl shadow-teal-950/30 transition hover:-translate-y-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <HydrationSafeIcon className="h-4 w-4 animate-spin" icon={RefreshCw} />
              ) : (
                <HydrationSafeIcon
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  icon={ArrowRight}
                />
              )}
              {isLoading ? "Comparing" : "Compare options"}
            </button>

            {notice ? (
              <p className="rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {notice}
              </p>
            ) : null}
          </form>
        </section>

        {response ? (
          <ComparisonResults response={response} selectedTags={selectedTags} />
        ) : (
          <EmptyComparisonState />
        )}
      </section>
    </main>
  );
}

function ComparisonResults({
  response,
  selectedTags,
}: {
  response: TransportComparisonResponse;
  selectedTags: Map<string, string[]>;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
              Retrieved {formatIsoMinute(response.fetchedAt)}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">Normalized comparison</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
            Currency {response.currency}
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {response.options.map((option) => (
            <TransportOptionCard
              key={option.id}
              option={option}
              tags={selectedTags.get(option.id) ?? []}
            />
          ))}
        </div>

        <div className="rounded-[2rem] border border-amber-200/20 bg-amber-200/10 p-5 text-sm leading-6 text-amber-50">
          <div className="mb-2 flex items-center gap-2 font-black uppercase tracking-[0.18em]">
            <HydrationSafeIcon className="h-4 w-4" icon={AlertTriangle} />
            Transparency notes
          </div>
          <ul className="grid gap-2">
            {response.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="grid gap-4 self-start">
        <CostSummary response={response} />
        <ProviderPanel response={response} />
      </aside>
    </section>
  );
}

function TransportOptionCard({
  option,
  tags,
}: {
  option: TransportComparisonOption;
  tags: string[];
}) {
  const meta = modeMeta[option.mode];
  const source = sourceCopy[option.source];

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-200 text-slate-950">
            <HydrationSafeIcon className="h-5 w-5" icon={meta.icon} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {meta.label}
            </p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">{option.title}</h3>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black ${source.className}`}
        >
          {source.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="rounded-full border border-teal-200/25 bg-teal-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-100"
            key={tag}
          >
            {tag}
          </span>
        ))}
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
          {option.confidence} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric icon={IndianRupee} label="Total" value={formatInr(option.totalPriceInr)} />
        <Metric icon={Clock3} label="Duration" value={formatDuration(option.durationMinutes)} />
        <Metric icon={ArrowRight} label="Distance" value={`${option.distanceKm} km`} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm font-bold text-white">{option.provider}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Depart {option.departureLabel} → arrive {option.arrivalLabel}. Possible taxes/fees:{" "}
          {formatInr(option.possibleTaxesInr)}.
        </p>
        <p className="mt-3 text-xs leading-5 text-teal-100">{option.bookingHint}</p>
      </div>

      <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-400">
        {option.extraCharges.map((charge) => (
          <p key={charge}>+ {charge}</p>
        ))}
      </div>
    </article>
  );
}

function CostSummary({ response }: { response: TransportComparisonResponse }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-100">
        Trip cost engine
      </p>
      <h3 className="mt-3 text-3xl font-black tracking-[-0.06em]">
        {formatInr(response.totals.estimatedTripTotalInr)}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {response.totals.travellers} traveller(s), {response.totals.nights} night(s), estimated
        end-to-end.
      </p>

      <div className="mt-5 grid gap-2">
        {response.costBreakdown.map((item) => (
          <div
            className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3"
            key={item.key}
          >
            <div>
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-teal-100">{formatInr(item.amountInr)}</p>
              <p className="mt-1 text-[10px] font-black text-slate-500">{item.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderPanel({ response }: { response: TransportComparisonResponse }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        <HydrationSafeIcon className="h-4 w-4 text-teal-200" icon={ShieldCheck} />
        Provider labels
      </p>
      <div className="mt-4 grid gap-3">
        {response.providers.map((provider) => {
          const source = sourceCopy[provider.source];

          return (
            <div
              className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
              key={provider.providerName}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">{provider.providerName}</p>
                <span
                  className={`rounded-full border px-2 py-1 text-[9px] font-black ${source.className}`}
                >
                  {source.label}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{provider.notes}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyComparisonState() {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-slate-300 shadow-2xl shadow-black/25 backdrop-blur-xl lg:grid-cols-3">
      {[
        ["1", "Enter origin, destination and dates."],
        ["2", "Compare flight, rail, bus and drive in one normalized view."],
        ["3", "Read LIVE/SANDBOX/ESTIMATED labels before trusting the value."],
      ].map(([step, label]) => (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5" key={step}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-200 text-sm font-black text-slate-950">
            {step}
          </span>
          <p className="mt-4 text-sm leading-6">{label}</p>
        </div>
      ))}
    </section>
  );
}

function TextField({
  label,
  list,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  list?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        className="bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
        list={list}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5" icon={CalendarDays} />
        {label}
      </span>
      <input
        className="bg-transparent text-sm font-bold text-white outline-none"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5" icon={Users} />
        {label}
      </span>
      <input
        className="bg-transparent text-sm font-bold text-white outline-none"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function Metric({ icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5 text-teal-200" icon={icon} />
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function toTransportPayload(formState: FormState): TransportComparisonRequest {
  return {
    currency: "INR",
    departureDate: formState.departureDate,
    destination: formState.destination,
    origin: formState.origin,
    returnDate: formState.returnDate || undefined,
    travellers: {
      adults: formState.adults,
      children: formState.children,
    },
  };
}

function addTag(tags: Map<string, string[]>, optionId: string, tag: string) {
  const currentTags = tags.get(optionId) ?? [];
  tags.set(optionId, [...currentTags, tag]);
}

function formatInr(value: number) {
  return `₹${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatIsoMinute(value: string) {
  return `${value.replace("T", " ").slice(0, 16)} UTC`;
}
