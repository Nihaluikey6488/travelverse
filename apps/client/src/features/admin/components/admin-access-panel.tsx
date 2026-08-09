"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Loader2, LockKeyhole, MapPinned } from "lucide-react";
import type { AuthUser } from "@travelverse/contracts";
import { checkAdminAccess } from "@/features/auth/components/auth-api";

export function AdminAccessPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    checkAdminAccess()
      .then((response) => {
        setUser(response.user);
        setStatus("allowed");
      })
      .catch(() => {
        setStatus("denied");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
        {status === "loading" ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
            Verifying admin role...
          </div>
        ) : null}

        {status === "denied" ? (
          <div className="space-y-5 text-center">
            <LockKeyhole className="mx-auto h-12 w-12 text-orange-300" />
            <h1 className="text-3xl font-black">Admin access required</h1>
            <p className="mx-auto max-w-xl text-slate-300">
              Yeh route backend role guard se protected hai. Seeded admin se login karo:
              admin@travelverse.local / Admin@12345.
            </p>
            <Link
              className="inline-flex rounded-2xl bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950"
              href="/login"
            >
              Login as admin
            </Link>
          </div>
        ) : null}

        {status === "allowed" && user ? (
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-300/15 px-4 py-2 text-sm font-semibold text-orange-100">
              <Crown className="h-4 w-4" />
              Admin verified: {user.name}
            </span>
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                Destination control room
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Day 3 mein secure gate ready hai. Agle days mein yahin destinations, hotels,
                sources, routes aur review workflow add/edit controls connect honge.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Destination drafts", "Hotel source queue", "Costing data review"].map((item) => (
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5" key={item}>
                  <MapPinned className="mb-4 h-6 w-6 text-teal-300" />
                  <p className="font-semibold">{item}</p>
                  <p className="mt-2 text-sm text-slate-400">Protected by ADMIN role.</p>
                </div>
              ))}
            </div>
            <Link
              className="inline-flex rounded-2xl bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950"
              href="/admin/destinations"
            >
              Open destination editor
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
