"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Loader2, LockKeyhole, Mail, MapPinned, UserRound } from "lucide-react";
import {
  loginRequestSchema,
  registerRequestSchema,
  type LoginRequest,
  type RegisterRequest,
} from "@travelverse/contracts";
import { login, register } from "./auth-api";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegisterMode = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const basePayload: LoginRequest = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = isRegisterMode
      ? registerRequestSchema.safeParse({
          ...basePayload,
          name: String(formData.get("name") ?? ""),
        })
      : loginRequestSchema.safeParse(basePayload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isRegisterMode) {
        await register(parsed.data as RegisterRequest);
      } else {
        await login(parsed.data);
      }

      router.push("/account");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_30%)]" />
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:border-teal-300/70 hover:text-white"
              href="/"
            >
              <Compass className="h-4 w-4 text-teal-300" />
              Back to TravelVerse
            </Link>

            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-teal-400/10 px-4 py-2 text-sm font-medium text-teal-200 ring-1 ring-teal-300/20">
                Day 3 auth foundation
              </span>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                {isRegisterMode ? "Create your traveller account." : "Welcome back, explorer."}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Save routes, plan trips, unlock admin controls later, and keep your discovery
                session secure with HttpOnly cookie auth.
              </p>
            </div>

            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              {["Secure JWT cookie", "Mongo user store", "Admin-ready roles"].map((item) => (
                <div
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-200 shadow-2xl shadow-black/20"
                  key={item}
                >
                  <MapPinned className="mb-3 h-5 w-5 text-orange-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-teal-950/40 backdrop-blur-xl sm:p-8"
            onSubmit={handleSubmit}
          >
            <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="relative space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">
                  {isRegisterMode ? "Register" : "Login"}
                </p>
                <h2 className="mt-3 text-3xl font-bold">
                  {isRegisterMode ? "Start planning smarter" : "Continue your journey"}
                </h2>
              </div>

              {isRegisterMode ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Name</span>
                  <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                    <UserRound className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      name="name"
                      placeholder="Your full name"
                      required
                      type="text"
                    />
                  </span>
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Email</span>
                <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Password</span>
                <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    minLength={8}
                    name="password"
                    placeholder="Minimum 8 characters"
                    required
                    type="password"
                  />
                </span>
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </p>
              ) : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-300 to-orange-300 px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-slate-950 shadow-lg shadow-teal-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isRegisterMode ? "Create account" : "Login"}
              </button>

              <p className="text-center text-sm text-slate-300">
                {isRegisterMode ? "Already have an account?" : "New to TravelVerse?"}{" "}
                <Link
                  className="font-semibold text-teal-200 underline-offset-4 hover:underline"
                  href={isRegisterMode ? "/login" : "/register"}
                >
                  {isRegisterMode ? "Login" : "Register"}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
