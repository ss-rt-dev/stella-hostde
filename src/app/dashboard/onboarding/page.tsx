"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "join" | "create">("choose");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function selectTeam(teamId: string) {
    await fetch("/api/teams/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    router.replace("/dashboard");
    router.refresh();
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      await selectTeam(data.team.id);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      await selectTeam(data.team.id);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#121214] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            Willkommen bei Stella
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Dein Team</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Hast du einen Einladungscode? Oder legst du als Owner ein neues Team an?
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode("join")}
              className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-left transition hover:bg-amber-500/15"
            >
              <p className="font-semibold text-amber-400">Einladungscode eingeben</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Buchstaben + 3 Zahlen, z.B. STEL742
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition hover:bg-white/[0.06]"
            >
              <p className="font-semibold text-white">Neues Team erstellen</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Du wirst Owner · max. 10 eigene Teams
              </p>
            </button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={join} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Einladungscode</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="STEL742"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm tracking-wider text-white outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "…" : "Beitreten"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
            >
              Zurück
            </button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Team-Name</label>
              <input
                required
                minLength={2}
                maxLength={48}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mein Team"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "…" : "Team anlegen"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
            >
              Zurück
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
