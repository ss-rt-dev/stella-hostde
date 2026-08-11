"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";

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
  const { t: tr, locale } = useI18n();
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
        setError(data.error || tr("tickets_load_error"));
        setTickets([]);
      } else if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets(data.tickets || []);
      }
    } catch {
      setError(tr("tickets_load_error"));
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
        setError(tr("err_name"));
        setCreating(false);
        return;
      }
      const ageNum = parseInt(age.trim(), 10);
      if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 99) {
        setError(tr("err_age"));
        setCreating(false);
        return;
      }
      if (!discordName.trim()) {
        setError(tr("err_discord"));
        setCreating(false);
        return;
      }
      if (!applyRole.trim()) {
        setError(tr("err_apply_role"));
        setCreating(false);
        return;
      }
      if (availability.trim().length < 5) {
        setError(tr("err_availability"));
        setCreating(false);
        return;
      }
      if (
        aboutMe.trim().length < 30 ||
        whyRole.trim().length < 30 ||
        whyBetter.trim().length < 30 ||
        contribution.trim().length < 30
      ) {
        setError(tr("err_app_texts"));
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
        setError(data.error || tr("error"));
        return;
      }
      setSubject("");
      setDescription("");
      resetAppFields();
      setOk(
        type === "TEAM_APPLICATION"
          ? tr("application_sent")
          : audience === "PLATFORM"
            ? tr("ticket_sent_admins")
            : tr("team_ticket_created")
      );
      load();
    } catch {
      setError(tr("network_error"));
    } finally {
      setCreating(false);
    }
  }

  function fmt(d: string) {
    return new Date(d).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const isApp = type === "TEAM_APPLICATION";
  const effectiveAudience = isApp ? "PLATFORM" : audience;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{tr("support_title")}</h1>
        <p className="text-sm text-zinc-500">{tr("support_sub")}</p>
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
            ? tr("team_application_admins")
            : effectiveAudience === "PLATFORM"
              ? tr("ticket_to_admins")
              : tr("new_team_ticket")}
        </h2>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        )}
        {ok && (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{ok}</p>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">{tr("ticket_to")}</label>
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
              {tr("team")}
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
              {tr("platform_admin")}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600">
            {effectiveAudience === "PLATFORM"
              ? tr("platform_ping_hint")
              : tr("team_no_ping_hint")}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">{tr("ticket_type")}</label>
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
              {tr("general")}
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
              {tr("discord")}
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
                {tr("team_application")}
              </button>
            )}
          </div>
        </div>

        {isApp && (
          <div className="space-y-4 rounded-xl border border-purple-500/20 bg-black/30 p-4">
            <p className="text-xs text-purple-300/80">{tr("app_hint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">{tr("name")} *</label>
                <input required value={realName} onChange={(e) => setRealName(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">{tr("age")} *</label>
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
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("discord_name")} *</label>
              <input required value={discordName} onChange={(e) => setDiscordName(e.target.value)} placeholder="username" className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("apply_as")} *</label>
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
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("availability")} *</label>
              <input required value={availability} onChange={(e) => setAvailability(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("about_you")} *</label>
              <textarea required rows={3} value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("why_role")} *</label>
              <textarea required rows={3} value={whyRole} onChange={(e) => setWhyRole(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("why_you")} *</label>
              <textarea required rows={3} value={whyBetter} onChange={(e) => setWhyBetter(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("contribution")} *</label>
              <textarea required rows={3} value={contribution} onChange={(e) => setContribution(e.target.value)} className={fieldCls} />
            </div>
          </div>
        )}

        {!isApp && (
          <>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("subject")} *</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">{tr("description")} *</label>
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldCls} />
            </div>
            {type === "DISCORD" && (
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">{tr("discord_name_optional")}</label>
                <input value={discordName} onChange={(e) => setDiscordName(e.target.value)} className={fieldCls} />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={creating}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
            isApp
              ? "bg-purple-500 text-white hover:bg-purple-400"
              : effectiveAudience === "PLATFORM"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-amber-400 text-black hover:bg-amber-300"
          }`}
        >
          {creating
            ? "…"
            : isApp
              ? tr("send_application")
              : effectiveAudience === "PLATFORM"
                ? tr("send_to_admins")
                : tr("submit_ticket")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">{tr("your_tickets")}</h2>
          <p className="text-xs text-zinc-500">{tr("your_tickets_sub")}</p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-zinc-500">{tr("loading")}</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">{tr("no_tickets")}</p>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="flex flex-col gap-1 px-5 py-4 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-200">{ticket.subject}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ticket.status === "OPEN"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {ticket.status === "OPEN" ? tr("ticket_open") : tr("ticket_closed")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ticket.type === "TEAM_APPLICATION"
                          ? "bg-purple-500/15 text-purple-300"
                          : ticket.audience === "PLATFORM"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {ticket.type === "TEAM_APPLICATION"
                        ? tr("team_application")
                        : ticket.audience === "PLATFORM"
                          ? tr("nav_admin")
                          : ticket.type === "DISCORD"
                            ? tr("discord")
                            : tr("team")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {fmt(ticket.createdAt)}
                    {ticket.user ? ` · ${ticket.user.name || ticket.user.email}` : ""}
                    {ticket._count?.messages != null
                      ? ` · ${ticket._count.messages} ${tr("messages_count")}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-amber-400">{tr("open_arrow")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
