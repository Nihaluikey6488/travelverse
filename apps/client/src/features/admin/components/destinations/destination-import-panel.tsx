"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertTriangle, DatabaseZap, ExternalLink, Loader2, Search, Sparkles } from "lucide-react";
import type {
  DestinationImportCandidate,
  DestinationImportPreview,
  DestinationImportResult,
  DestinationImportSearchResponse,
  SourceAttribution,
} from "@travelverse/contracts";
import { resolveSourceLink } from "@/lib/source-attribution";
import {
  importDestinationDraft,
  previewDestinationImport,
  searchImportCandidates,
} from "./destination-admin-api";

type DestinationImportPanelProps = {
  onImported: () => Promise<void> | void;
};

export function DestinationImportPanel({ onImported }: DestinationImportPanelProps) {
  const [query, setQuery] = useState("");
  const [searchResponse, setSearchResponse] = useState<DestinationImportSearchResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<DestinationImportCandidate | null>(null);
  const [preview, setPreview] = useState<DestinationImportPreview | null>(null);
  const [result, setResult] = useState<DestinationImportResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (query.trim().length < 2) {
      setError("Search ke liye at least 2 characters required hain.");
      return;
    }

    setError(null);
    setResult(null);
    setPreview(null);
    setSelectedCandidate(null);
    setIsSearching(true);

    try {
      setSearchResponse(await searchImportCandidates(query.trim()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not search providers.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePreview(candidate: DestinationImportCandidate) {
    setError(null);
    setResult(null);
    setSelectedCandidate(candidate);
    setIsPreviewing(true);

    try {
      setPreview(await previewDestinationImport(candidate));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not build import preview.",
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    if (!selectedCandidate) {
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const importResult = await importDestinationDraft(selectedCandidate);
      setResult(importResult);
      setPreview({
        candidate: importResult.candidate,
        draft: importResult.draft,
        importedFields: importResult.importedFields,
        sources: importResult.sources,
        warnings: importResult.warnings,
      });
      await onImported();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not import destination.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-teal-200/15 bg-teal-200/[0.06] p-5 shadow-2xl shadow-teal-950/20">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-teal-100">
            <DatabaseZap className="h-3.5 w-3.5" />
            Day 5 import pipeline
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Import destination from net</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Admin search karega, provider matches dekhega, imported draft preview verify karega,
            then save as DRAFT. Content kabhi auto-publish nahi hota.
          </p>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
              <Search className="h-4 w-4 text-teal-200" />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Udaipur, Manali, Mysore..."
                value={query}
              />
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
              disabled={isSearching}
              type="submit"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Search
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <Warnings warnings={searchResponse?.warnings ?? []} />

          <div className="mt-5 space-y-3">
            {searchResponse?.data.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                No provider matches found. Try a broader city/place name.
              </p>
            ) : null}

            {searchResponse?.data.map((candidate) => (
              <button
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedCandidate?.externalId === candidate.externalId
                    ? "border-teal-200/70 bg-teal-200/10"
                    : "border-white/10 bg-slate-950/70 hover:border-white/25"
                }`}
                key={candidate.externalId}
                onClick={() => handlePreview(candidate)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{candidate.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{candidate.displayName}</p>
                  </div>
                  {isPreviewing && selectedCandidate?.externalId === candidate.externalId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {candidate.provider} {candidate.category ? `• ${candidate.category}` : ""}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5">
          <h3 className="text-xl font-black">Imported draft preview</h3>

          {!preview ? (
            <p className="mt-4 rounded-2xl bg-white/[0.04] p-5 text-sm leading-6 text-slate-400">
              Select a provider match to fetch knowledge/media and preview normalized draft fields.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div
                className="min-h-56 rounded-3xl border border-white/10 bg-cover bg-center p-5"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(3,7,18,0.2), rgba(3,7,18,0.92)), url(${preview.draft.heroImageUrl})`,
                }}
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-100">
                  {preview.draft.status}
                </p>
                <h4 className="mt-16 text-4xl font-black tracking-tight">{preview.draft.name}</h4>
                <p className="mt-2 text-sm text-slate-300">
                  {preview.draft.region}, {preview.draft.country}
                </p>
              </div>

              <p className="text-sm leading-6 text-slate-300">{preview.draft.summary}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Slug" value={preview.draft.slug} />
                <Info
                  label="Coordinates"
                  value={`${preview.draft.coordinates.lat}, ${preview.draft.coordinates.lng}`}
                />
                <Info label="Imported fields" value={preview.importedFields.join(", ")} />
                <Info label="Sources" value={`${preview.sources.length} source(s)`} />
              </div>

              <Warnings warnings={preview.warnings} />

              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Source attribution
                </p>
                {preview.sources.map((source) => (
                  <ImportSourceLink
                    key={`${source.provider}-${source.sourceUrl}`}
                    source={source}
                  />
                ))}
                {preview.sources.map((source) => (
                  <a
                    className="hidden"
                    href={source.sourceUrl}
                    key={`legacy-${source.provider}-${source.sourceUrl}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>
                      {source.provider} • {source.license}
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                disabled={isImporting}
                onClick={handleImport}
                type="button"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
                Save imported draft
              </button>

              {result ? (
                <p className="rounded-2xl border border-teal-200/20 bg-teal-200/10 px-4 py-3 text-sm text-teal-100">
                  Draft created: {result.destination.name} ({result.destination.slug})
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function ImportSourceLink({ source }: { source: SourceAttribution }) {
  const link = resolveSourceLink(source.sourceUrl);
  const className =
    "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 hover:border-teal-200/40";
  const content = (
    <>
      <span>
        {source.provider} • {source.license}
      </span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </>
  );

  if (!link.isExternal) {
    return (
      <Link className={className} href={link.href}>
        {content}
      </Link>
    );
  }

  return (
    <a className={className} href={link.href} rel="noreferrer" target="_blank">
      {content}
    </a>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {warnings.map((warning) => (
        <p
          className="flex gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-100"
          key={warning}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {warning}
        </p>
      ))}
    </div>
  );
}
