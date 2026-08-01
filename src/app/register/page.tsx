"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const LOGO_USER = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registrierung fehlgeschlagen");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[#060608]" />
      <div
        className="pointer-events-none absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.35), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-1/4 h-[380px] w-[380px] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(245,200,50,0.2), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src={LOGO_USER}
            alt="Stella Host"
            width={56}
            height={56}
            className="mb-3 h-14 w-14 object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]"
            unoptimized
            priority
          />
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Stella<span className="text-amber-400">Host</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Konto erstellen</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl"
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="mb-6 text-lg font-semibold text-white">Registrieren</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                E-Mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Passwort (min. 8 Zeichen)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/25 transition hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50"
          >
            {loading ? "Wird erstellt…" : "Konto erstellen"}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Bereits registriert?{" "}
            <Link
              href="/login"
              className="font-medium text-amber-400 transition hover:text-amber-300"
            >
              Anmelden
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          © 2026 Stella Host
        </p>
      </div>
    </main>
  );
}
