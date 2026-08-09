"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TeamRow = {
  id: string;
  name: string;
  inviteCode?: string;
  role: string;
  memberCount: number;
  isOwner: boolean;
};

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [maxOwned, setMaxOwned] = useState(10);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const res = await fetch("/api/teams");
    const data = await res.json();
    if (res.ok) {
      setTeams(data.teams || []);
      setOwnedCount(data.ownedCount || 0);
      setMaxOwned(data.maxOwned || 10);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function select(teamId: string) {
    await fetch("/api/teams/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
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
      setName("");
      setShowCreate(false);
      await select(data.team.id);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="text-zinc-500">Laden…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Deine Teams</h1>
          <p className="text-sm text-zinc-500">
            Jedes Team ist getrennt · {ownedCount}/{maxOwned} als Owner
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/onboarding"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Code eingeben
          </Link>
          {ownedCount < maxOwned && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
            >
              + Team
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {showCreate && (
        <form onSubmit={create} className="flex flex-wrap gap-2 rounded-2xl border border-amber-500/25 bg-[#121214] p-4">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team-Name"
            className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none"
          />
          <button type="submit" disabled={creating} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            Anlegen
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-3 py-2 text-sm text-zinc-500">
            Abbrechen
          </button>
        </form>
      )}

      {teams.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-12 text-center text-sm text-zinc-500">
          Noch kein Team – Code eingeben oder neues Team erstellen.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              className="rounded-2xl border border-white/10 bg-[#121214] p-5 text-left transition hover:border-amber-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.role} · {t.memberCount} Mitglied{t.memberCount === 1 ? "" : "er"}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  Öffnen
                </span>
              </div>
              {t.inviteCode && (
                <p className="mt-3 font-mono text-xs tracking-wider text-zinc-400">
                  Code: <span className="text-amber-400">{t.inviteCode}</span>
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
