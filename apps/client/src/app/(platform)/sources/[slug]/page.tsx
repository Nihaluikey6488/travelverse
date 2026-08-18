import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Database, ShieldCheck, TriangleAlert } from "lucide-react";

type SourcePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type SourceExplainer = {
  description: string;
  license: string;
  limitations: string[];
  title: string;
  trustStatus: string;
  usedFor: string[];
};

const sourceExplainers: Record<string, SourceExplainer> = {
  "admin-curated": {
    description:
      "This source marks content created or reviewed inside the TravelVerse admin workspace. It is useful for production demos because the app can show who curated destination story, practical tips and media references before publishing.",
    license: "Admin curated content; attach original third-party references before public release.",
    limitations: [
      "Admin-created facts should be cross-checked against official tourism or provider pages.",
      "Costing, hotel and route estimates are planning aids, not guaranteed booking prices.",
    ],
    title: "Admin curated TravelVerse source",
    trustStatus: "Verified by admin workflow",
    usedFor: ["Destination drafts", "Manual review", "Published story sections"],
  },
  "manual-demo": {
    description:
      "This source marks production-safe showcase content bundled with the MVP seed data. It keeps the demo stable while live provider imports are reviewed by an admin before publishing.",
    license: "Internal demo content with visible media credits where applicable.",
    limitations: [
      "Seed content is intentionally small and should not replace verified real-world travel research.",
      "Before production launch, replace demo-only notes with official, provider or locally verified sources.",
    ],
    title: "Manual demo seed source",
    trustStatus: "Demo verified",
    usedFor: ["Showcase destinations", "Portfolio demo", "Offline-friendly testing"],
  },
};

export async function generateMetadata({ params }: SourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const source = getSourceExplainer(slug);

  return {
    description:
      "Understand how TravelVerse labels destination data sources, verification status and production attribution.",
    title: `${source.title} | TravelVerse sources`,
  };
}

export default async function SourceAttributionPage({ params }: SourcePageProps) {
  const { slug } = await params;
  const source = getSourceExplainer(slug);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_30%)]" />

      <section className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-teal-200/40 hover:text-white"
          href="/explore"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-teal-950/30 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-teal-200">
            <ShieldCheck className="h-5 w-5" />
            Source transparency
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] text-slate-500">
                /sources/{slug}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                {source.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {source.description}
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-teal-200/20 bg-teal-200/10 p-5">
              <p className="flex items-center gap-2 text-sm font-black text-teal-100">
                <CheckCircle2 className="h-4 w-4" />
                {source.trustStatus}
              </p>
              <p className="mt-3 text-sm leading-6 text-teal-50/80">{source.license}</p>
            </aside>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <InfoCard
              icon={<Database className="h-5 w-5 text-orange-200" />}
              items={source.usedFor}
              title="Used inside TravelVerse for"
            />
            <InfoCard
              icon={<TriangleAlert className="h-5 w-5 text-amber-200" />}
              items={source.limitations}
              title="Production notes"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  items,
  title,
}: {
  icon: ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-300">
        {icon}
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSourceExplainer(slug: string): SourceExplainer {
  return (
    sourceExplainers[slug] ?? {
      description:
        "This source is not part of the built-in TravelVerse registry yet. Treat it as a review item until an admin attaches provider details, license notes and verification status.",
      license: "Unknown source license; review before publishing.",
      limitations: [
        "Attach a real source URL before using this content in production.",
        "Mark the destination as draft until source verification is complete.",
      ],
      title: "Unregistered source",
      trustStatus: "Needs admin review",
      usedFor: ["Draft review", "Source cleanup", "Admin verification"],
    }
  );
}
