"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

const LOGO = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      setError("E-Mail oder Passwort falsch");
      return;
    }

    // IP tracken nicht abwarten – schneller Redirect
    void fetch("/api/session/track", { method: "POST" });
    window.location.assign("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0c] p-4">
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "rgba(251,191,36,0.35)" }}
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO}
            alt=""
            width={48}
            height={48}
            className="mb-2 h-12 w-12 object-contain"
            decoding="async"
            fetchPriority="high"
          />
          <h1 className="text-xl font-semibold text-white">
            Stella<span className="text-amber-400">Dashboard</span>
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">Willkommen zurück</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#121214] p-6 sm:p-8"
        >
          <h2 className="mb-5 text-lg font-semibold text-white">Anmelden</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">E-Mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Passwort</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Wird angemeldet…" : "Anmelden"}
          </button>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Noch kein Konto?{" "}
            <Link href="/register" className="font-medium text-amber-400 hover:text-amber-300">
              Registrieren
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
