"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  type: string;
  status: string;
  discordName?: string | null;
  applyRole?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

type TicketType = "GENERAL" | "SERVER" | "TEAM_APPLICATION";

const APPLY_ROLES = [
  "Supporter",
  "Moderator",
  "Entwickler",
  "Designer",
  "Community Manager",
  "Sonstiges",
] as const;

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("GENERAL");
  const [discordName, setDiscordName] = useState("");
  const [applyRole, setApplyRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setTickets(await res.json());
    } catch {
      setError("Tickets konnten nicht geladen werden");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setOk("");

    if (type === "TEAM_APPLICATION") {
      if (!discordName.trim()) {
        setError("Discord-Name ist Pflicht");
        setCreating(false);
        return;
      }
      if (!applyRole.trim()) {
        setError("Bitte wähle, als was du dich bewirbst");
        setCreating(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          description,
          type,
          ...(type === "TEAM_APPLICATION"
            ? { discordName: discordName.trim(), applyRole: applyRole.trim() }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setSubject("");
      setDescription("");
      setDiscordName("");
      setApplyRole("");
      setOk(
        type === "TEAM_APPLICATION"
          ? "Bewerbung eingereicht – das Team meldet sich."
          : "Ticket erstellt – das Team wurde benachrichtigt."
      );
      load();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  function fmt(d: string) {
    return new Date(d).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Support</h1>
        <p className="text-sm text-zinc-500">
          Ticket erstellen, Server-Hilfe oder Team-Bewerbung
        </p>
      </div>

      <form
        onSubmit={createTicket}
        className="space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">Neues Ticket</h2>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            {ok}
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Support-Art
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["GENERAL", "Normaler Support"],
                ["SERVER", "Server Support"],
                ["TEAM_APPLICATION", "Team Bewerbung"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={`rounded-xl py-2.5 text-sm font-medium transition ${
                  type === id
                    ? "bg-amber-400 text-black"
                    : "border border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {type === "TEAM_APPLICATION" && (
          <div className="space-y-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-xs text-purple-300/80">
              Bewerbung fürs Stella-Host-Team. Discord-Name und gewünschte Rolle
              sind Pflicht.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Discord-Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={discordName}
                onChange={(e) => setDiscordName(e.target.value)}
                placeholder="z.B. name oder name#0000"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Bewerbung als <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {APPLY_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setApplyRole(role)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      applyRole === role
                        ? "bg-purple-500/30 text-purple-200"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {type === "TEAM_APPLICATION" ? "Kurz-Titel" : "Grund"}
          </label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={
              type === "TEAM_APPLICATION"
                ? "z.B. Bewerbung als Supporter"
                : "Kurzer Betreff"
            }
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {type === "TEAM_APPLICATION"
              ? "Erfahrung & Motivation"
              : "Beschreibung"}
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "TEAM_APPLICATION"
                ? "Warum möchtest du ins Team? Erfahrung, Verfügbarkeit, Stärken…"
                : "Beschreibe dein Anliegen…"
            }
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {creating
            ? "Wird gesendet…"
            : type === "TEAM_APPLICATION"
              ? "Bewerbung absenden"
              : "Ticket absenden"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Deine Tickets</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-zinc-500">Lade…</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">
            Noch keine Tickets
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.id}`}
                className="flex flex-col gap-1 px-5 py-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-200">{t.subject}</span>
                    <StatusBadge status={t.status} />
                    <TypeBadge type={t.type} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {fmt(t.createdAt)}
                    {t._count?.messages != null &&
                      ` · ${t._count.messages} Nachrichten`}
                    {t.type === "TEAM_APPLICATION" &&
                      t.applyRole &&
                      ` · ${t.applyRole}`}
                  </p>
                </div>
                <span className="text-xs text-amber-400">Öffnen →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const open = status === "OPEN";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        open
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {open ? "Offen" : "Geschlossen"}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const label =
    type === "SERVER"
      ? "Server"
      : type === "TEAM_APPLICATION"
        ? "Team Bewerbung"
        : "Allgemein";
  const cls =
    type === "TEAM_APPLICATION"
      ? "bg-purple-500/15 text-purple-300"
      : "bg-white/5 text-zinc-400";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}
