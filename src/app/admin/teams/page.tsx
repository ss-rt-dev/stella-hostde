"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TeamRow = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  owner: { id: string; name: string | null; email: string };
  _count: { members: number; todos: number; announcements: number };
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/teams");
    if (res.ok) {
      setTeams(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ownerEmail: ownerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        setBusy(false);
        return;
      }
      setMsg(`Team „${data.team.name}“ erstellt · Code ${data.team.inviteCode}`);
      setName("");
      setOwnerEmail("");
      setShowCreate(false);
      await load();
    } catch {
      setError("Netzwerkfehler");
    }
    setBusy(false);
  }

  async function deleteTeam(t: TeamRow) {
    if (
      !confirm(
        `Team „${t.name}“ wirklich löschen?\n\nMitglieder, Todos, Board und Team-Tickets werden mitgelöscht.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/teams/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        setBusy(false);
        return;
      }
      setMsg(`Team „${t.name}“ gelöscht`);
      await load();
    } catch {
      setError("Netzwerkfehler");
    }
    setBusy(false);
  }

  if (loading) {
    return <p className="text-zinc-500">Lade Teams…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Alle Teams</h1>
          <p className="text-sm text-zinc-500">
            {teams.length} Workspaces · erstellen & löschen
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
        >
          {showCreate ? "Schließen" : "+ Team erstellen"}
        </button>
      </div>

      {(msg || error) && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm ${
            error
              ? "border border-red-500/20 bg-red-500/10 text-red-400"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {error || msg}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={createTeam}
          className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">Neues Team</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Team-Name *</label>
              <input
                required
                minLength={2}
                maxLength={48}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Support Crew"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Owner E-Mail (optional)
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="leer = du bist Owner"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "…" : "Team anlegen"}
          </button>
        </form>
      )}

      {teams.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-12 text-center text-sm text-zinc-500">
          Noch keine Teams – oben „Team erstellen“ nutzen.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-600">
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-3 py-3 font-medium">Owner</th>
                  <th className="px-3 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium text-right">Mitglieder</th>
                  <th className="px-3 py-3 font-medium text-right">Todos</th>
                  <th className="px-3 py-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-zinc-200">{t.name}</td>
                    <td className="px-3 py-3 text-zinc-400">
                      {t.owner.name || t.owner.email}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tracking-wider text-amber-400/90">
                      {t.inviteCode}
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {t._count.members}
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {t._count.todos}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/teams/${t.id}`}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-white/5"
                        >
                          Öffnen
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteTeam(t)}
                          className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
