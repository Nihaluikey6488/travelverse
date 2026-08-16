"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Compass, Loader2, RefreshCw } from "lucide-react";
import { HydrationSafeIcon } from "./hydration-safe-icon";

type StatePanelProps = {
  action?: ReactNode;
  message: string;
  title: string;
};

export function LoadingStatePanel({
  message,
  title = "Loading",
}: Partial<StatePanelProps> & { title?: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl shadow-black/25 backdrop-blur-xl">
      <HydrationSafeIcon className="mx-auto h-9 w-9 animate-spin text-teal-200" icon={Loader2} />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-300">
        {message ?? "Fetching latest TravelVerse data..."}
      </p>
    </section>
  );
}

export function EmptyStatePanel({ action, message, title }: StatePanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/25 backdrop-blur-xl">
      <HydrationSafeIcon className="mx-auto h-10 w-10 text-teal-200" icon={Compass} />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function ErrorStatePanel({
  message,
  onRetry,
  title = "Something needs attention",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-red-300/20 bg-red-500/10 p-8 text-center shadow-2xl shadow-black/25 backdrop-blur-xl">
      <HydrationSafeIcon className="mx-auto h-10 w-10 text-red-100" icon={AlertTriangle} />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-red-50/90">{message}</p>
      {onRetry ? (
        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-200"
          onClick={onRetry}
          type="button"
        >
          <HydrationSafeIcon className="h-4 w-4" icon={RefreshCw} />
          Retry
        </button>
      ) : null}
    </section>
  );
}
