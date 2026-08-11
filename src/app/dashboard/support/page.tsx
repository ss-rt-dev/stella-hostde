"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  type: string;
  status: string;
  audience?: string;
  discordName?: string | null;
  applyRole?: string | null;
  createdAt: string;
  user?: { name: string | null; email: string };
  _count?: { messages: number };
}

type TicketType = "GENERAL" | "DISCORD" | "TEAM_APPLICATION";
type Audience = "TEAM" | "PLATFORM";

const APPLY_ROLES = [
  "Supporter",
  "Moderator",
  "Entwickler",
  "Designer",
  "Community Manager",
  "Sonstiges",
] as const;

const fieldCls =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50";

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<Audience>("TEAM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("GENERAL");
  const [discordName, setDiscordName] = useState("");
  const [applyRole, setApplyRole] = useState("");
  const [realName, setRealName] = useState("");
  const [age, setAge] = useState("");
  const [availability, setAvailability] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [whyRole, setWhyRole] = useState("");
  const [whyBetter, setWhyBetter] = useState("");
  const [contribution, setContribution] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tickets konnten nicht geladen werden");
        setTickets([]);
      } else if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets(data.tickets || []);
      }
    } catch {
      setError("Tickets konnten nicht geladen werden");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetAppFields() {
    setDiscordName("");
    setApplyRole("");
    setRealName("");
    setAge("");
    setAvailability("");
    setAboutMe("");
    setWhyRole("");
    setWhyBetter("");
    setContribution("");
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setOk("");

    if (type === "TEAM_APPLICATION") {
      if (!realName.trim() || realName.trim().length < 2) {
        setError("Bitte deinen Namen angeben");
        setCreating(false);
        return;
      }
      const ageNum = parseInt(age.trim(), 10);
      if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 99) {
        setError("Bitte ein gültiges Alter angeben (13–99)");
        setCreating(false);
        return;
      }
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
      if (availability.trim().length < 5) {
        setError("Bitte deine Verfügbarkeit angeben");
        setCreating(false);
        return;
      }
      if (
        aboutMe.trim().length < 30 ||
        whyRole.trim().length < 30 ||
        whyBetter.trim().length < 30 ||
        contribution.trim().length < 30
      ) {
        setError("Bitte alle Bewerbungstexte ausführlich ausfüllen (min. 30 Zeichen)");
        setCreating(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "TEAM_APPLICATION"
            ? {
                type,
                audience: "PLATFORM",
                realName: realName.trim(),
                age: parseInt(age.trim(), 10),
                discordName: discordName.trim(),
                applyRole: applyRole.trim(),
                availability: availability.trim(),
                aboutMe: aboutMe.trim(),
                whyRole: whyRole.trim(),
                whyBetter: whyBetter.trim(),
                contribution: contribution.trim(),
              }
            : {
                type,
                audience,
                subject,
                description,
                discordName:
                  type === "DISCORD" ? discordName.trim() || undefined : undefined,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setSubject("");
      setDescription("");
      resetAppFields();
      setOk(
        type === "TEAM_APPLICATION"
          ? "Bewerbung an die Platform Admins gesendet."
          : audience === "PLATFORM"
            ? "Ticket an die Admins gesendet."
            : "Team-Ticket erstellt."
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

  const isApp = type === "TEAM_APPLICATION";
  // Bewerbung immer Platform; sonst wie gewählt
  const effectiveAudience = isApp ? "PLATFORM" : audience;

  const typeOptions =
    audience === "PLATFORM" || isApp
      ? ([
          ["GENERAL", "Allgemein"],
          ["DISCORD", "Discord"],
          ["TEAM_APPLICATION", "Team-Bewerbung"],
        ] as const)
      : (["GENERAL", "Allgemein"], ["DISCORD", "Discord"] as const);

  // Fix typeOptions for TEAM - simpler inline below

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Support</h1>
        <p className="text-sm text-zinc-500">
          Team-Tickets oder direkt an die Platform-Admins
        </p>
      </div>

      <form
        onSubmit={createTicket}
        className={`space-y-4 rounded-2xl border p-5 ${
          isApp
            ? "border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-[#121214]"
            : effectiveAudience === "PLATFORM"
              ? "border-red-500/25 bg-gradient-to-b from-red-500/10 to-[#121214]"
              : "border-white/10 bg-[#121214]"
        }`}
      >
        <h2 className="font-semibold text-white">
          {isApp
            ? "Team-Bewerbung (Platform Admins)"
            : effectiveAudience === "PLATFORM"
              ? "Ticket an Admins"
              : "Neues Team-Ticket"}
        </h2>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        )}
        {ok && (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{ok}</p>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Ticket an
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAudience("TEAM");
                if (type === "TEAM_APPLICATION") setType("GENERAL");
              }}
              className={`rounded-xl py-2.5 text-sm font-medium transition ${
                effectiveAudience === "TEAM"
                  ? "bg-amber-400 text-black"
                  : "border border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              Team
            </button>
            <button
              type="button"
              onClick={() => setAudience("PLATFORM")}
              className={`rounded-xl py-2.5 text-sm font-medium transition ${
                effectiveAudience === "PLATFORM"
                  ? "bg-red-500 text-white"
                  : "border border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              Platform Admins
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600">
            {effectiveAudience === "PLATFORM"
              ? "Nur Platform-Admins · Staff wird auf Discord gepingt."
              : "Nur dein aktuelles Team · kein Discord-Ping."}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Art</label>
          <div
            className={`grid grid-cols-1 gap-2 ${
              effectiveAudience === "PLATFORM" ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setType("GENERAL")}
              className={`rounded-xl py-2.5 text-sm font-medium transition ${
                type === "GENERAL"
                  ? "bg-amber-400 text-black"
                  : "border border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              Allgemein
            </button>
            <button
              type="button"
              onClick={() => setType("DISCORD")}
              className={`rounded-xl py-2.5 text-sm font-medium transition ${
                type === "DISCORD"
                  ? "bg-amber-400 text-black"
                  : "border border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              Discord
            </button>
            {effectiveAudience === "PLATFORM" && (
              <button
                type="button"
                onClick={() => setType("TEAM_APPLICATION")}
                className={`rounded-xl py-2.5 text-sm font-medium transition ${
                  type === "TEAM_APPLICATION"
                    ? "bg-purple-500 text-white"
                    : "border border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                Team-Bewerbung
              </button>
            )}
          </div>
        </div>

        {isApp && (
          <div className="space-y-4 rounded-xl border border-purple-500/20 bg-black/30 p-4">
            <p className="text-xs text-purple-300/80">
              Bewerbung geht an die Platform Admins – das Staff-Team wird auf Discord benachrichtigt.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Name *</label>
                <input required value={realName} onChange={(e) => setRealName(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Alter *</label>
                <input
                  required
                  type="number"
                  min={13}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={fieldCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Discord-Name *</label>
              <input required value={discordName} onChange={(e) => setDiscordName(e.target.value)} placeholder="username" className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Bewerbung als *</label>
              <div className="flex flex-wrap gap-2">
                {APPLY_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setApplyRole(role)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      applyRole === role ? "bg-purple-500 text-white" : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Verfügbarkeit *</label>
              <input required value={availability} onChange={(e) => setAvailability(e.target.value)} className={fieldCls} />
            </div>
            {(
              [
                ["Über dich", aboutMe, setAboutMe],
                ["Warum diese Rolle?", whyRole, setWhyRole],
                ["Warum du?", whyBetter, setWhyBetter],
                ["Was willst du beitragen?", contribution, setContribution],
              ] as const
            ).map(([label, val, set]) => (
              <div key={label}>
                <label className="mb-1.5 block text-xs text-zinc-500">{label} *</label>
                <textarea required rows={3} minLength={30} value={val} onChange={(e) => set(e.target.value)} className={`${fieldCls} resize-y`} />
              </div>
            ))}
          </div>
        )}

        {!isApp && (
          <>
            {type === "DISCORD" && (
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Discord-Name (optional)</label>
                <input
                  value={discordName}
                  onChange={(e) => setDiscordName(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Betreff</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Beschreibung</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={creating}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${
            isApp
              ? "bg-purple-500 text-white"
              : effectiveAudience === "PLATFORM"
                ? "bg-red-500 text-white"
                : "bg-amber-400 text-black"
          }`}
        >
          {creating
            ? "…"
            : isApp
              ? "Bewerbung an Admins senden"
              : effectiveAudience === "PLATFORM"
                ? "An Admins senden"
                : "Ticket absenden"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Deine Tickets</h2>
          <p className="text-xs text-zinc-500">Team-Tickets + deine Admin-Tickets</p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-zinc-500">Lade…</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">Noch keine Tickets</p>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.id}`}
                className="flex flex-col gap-1 px-5 py-4 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-200">{t.subject}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.status === "OPEN"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {t.status === "OPEN" ? "Offen" : "Geschlossen"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.type === "TEAM_APPLICATION"
                          ? "bg-purple-500/15 text-purple-300"
                          : t.audience === "PLATFORM"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {t.type === "TEAM_APPLICATION"
                        ? "Bewerbung"
                        : t.audience === "PLATFORM"
                          ? "Admins"
                          : t.type === "DISCORD"
                            ? "Discord"
                            : "Team"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {fmt(t.createdAt)}
                    {t.user ? ` · ${t.user.name || t.user.email}` : ""}
                    {t._count?.messages != null ? ` · ${t._count.messages} Nachrichten` : ""}
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
