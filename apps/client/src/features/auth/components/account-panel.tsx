"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Compass, Loader2, LogOut, ShieldCheck } from "lucide-react";
import type { AuthUser } from "@travelverse/contracts";
import { getCurrentUser, logout } from "./auth-api";

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "guest">("loading");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        setUser(response.user);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("guest");
      });
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <Link className="inline-flex items-center gap-2 text-sm text-teal-200" href="/">
          <Compass className="h-4 w-4" />
          TravelVerse home
        </Link>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
          {status === "loading" ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
              Checking secure session...
            </div>
          ) : null}

          {status === "guest" ? (
            <div className="space-y-5 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-orange-300" />
              <h1 className="text-3xl font-black">Login required</h1>
              <p className="mx-auto max-w-xl text-slate-300">
                Account page protected API se user data fetch karta hai. Login karo, phir saved
                routes and future bookings yahin show honge.
              </p>
              <Link
                className="inline-flex rounded-2xl bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950"
                href="/login"
              >
                Go to login
              </Link>
            </div>
          ) : null}

          {status === "ready" && user ? (
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[1.5rem] border border-teal-300/20 bg-teal-300/10 p-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-300 text-3xl font-black text-slate-950">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <h1 className="mt-6 text-3xl font-black">{user.name}</h1>
                <p className="mt-2 text-slate-300">{user.email}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-teal-100">
                  <BadgeCheck className="h-4 w-4" />
                  {user.role} account
                </span>
              </div>

              <div className="space-y-5">
                <h2 className="text-2xl font-bold">Traveller command center</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    "Saved destination list",
                    "Route and costing plans",
                    "Hotel booking drafts",
                    "AI travel assistant later",
                  ].map((item) => (
                    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5" key={item}>
                      <p className="text-sm text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {user.role === "ADMIN" ? (
                    <Link
                      className="rounded-2xl bg-orange-300 px-5 py-3 text-sm font-bold text-slate-950"
                      href="/admin"
                    >
                      Open admin gate
                    </Link>
                  ) : null}
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-red-300/70 hover:text-red-100"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    type="button"
                  >
                    {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
