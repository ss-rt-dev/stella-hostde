"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import Link from "next/link";

type TicketType = "GENERAL" | "DISCORD" | "TEAM_APPLICATION";
type Audience = "TEAM" | "PLATFORM";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  type: string;
  audience?: string;
  createdAt: string;
  messageCount?: number;
};

export default function SupportPage() {
  const { t: tr } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [audience, setAudience] = useState<Audience>("TEAM");
  const [type, setType] = useState<TicketType>("GENERAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [discordName, setDiscordName] = useState("");
  const [age, setAge] = useState("");
  const [applyAs, setApplyAs] = useState("");
  const [availability, setAvailability] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [whyRole, setWhyRole] = useState("");
  const [whyYou, setWhyYou] = useState("");
  const [contribution, setContribution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/support/tickets");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || tr("tickets_load_error"));
      setLoading(false);
      return;
    }
    setTickets(data.tickets || []);
    setLoading(false);
  }, [tr]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setSubmitting(true);

    const effectiveAudience: Audience =
      type === "TEAM_APPLICATION" ? "PLATFORM" : audience;

    let body: Record<string, unknown> = {
      subject: subject.trim(),
      description: description.trim(),
      type,
      audience: effectiveAudience,
    };

    if (type === "DISCORD") {
      body.discordName = discordName.trim() || undefined;
    }

    if (type === "TEAM_APPLICATION") {
      body = {
        ...body,
        subject: subject.trim() || tr("team_application"),
        description: [
          `${tr("age")}: ${age}`,
          `${tr("apply_as")}: ${applyAs}`,
          `${tr("availability")}: ${availability}`,
          `${tr("about_you")}: ${aboutMe}`,
          `${tr("why_role")}: ${whyRole}`,
          `${tr("why_you")}: ${whyYou}`,
          `${tr("contribution")}: ${contribution}`,
          discordName ? `Discord: ${discordName}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        discordName: discordName.trim() || undefined,
        application: {
          age,
          applyAs,
          availability,
          aboutMe,
          whyRole,
          whyYou,
          contribution,
        },
      };
    }

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tr("error"));
        setSubmitting(false);
        return;
      }
      setOkMsg(
        type === "TEAM_APPLICATION"
          ? tr("application_sent")
          : effectiveAudience === "PLATFORM"
            ? tr("ticket_sent_admins")
            : tr("team_ticket_created")
      );
      setSubject("");
      setDescription("");
      setDiscordName("");
      setAge("");
      setApplyAs("");
      setAvailability("");
      setAboutMe("");
      setWhyRole("");
      setWhyYou("");
      setContribution("");
      setSubmitting(false);
      load();
    } catch {
      setError(tr("network_error"));
      setSubmitting(false);
    }
  }

  const isApp = type === "TEAM_APPLICATION";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{tr("support_title")}</h1>
        <p className="text-sm text-zinc-500">{tr("support_sub")}</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
      )}
      {okMsg && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{okMsg}</p>
      )}

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAudience("TEAM");
              if (type === "TEAM_APPLICATION") setType("GENERAL");
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              audience === "TEAM" && !isApp
                ? "bg-amber-400 text-black"
                : "border border-white/10 text-zinc-400"
            }`}
          >
            {tr("new_team_ticket")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAudience("PLATFORM");
              if (type === "TEAM_APPLICATION") setType("GENERAL");
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              audience === "PLATFORM" && !isApp
                ? "bg-amber-400 text-black"
                : "border border-white/10 text-zinc-400"
            }`}
          >
            {tr("ticket_to_admins")}
          </button>
          <button
            type="button"
            onClick={() => {
              setType("TEAM_APPLICATION");
              setAudience("PLATFORM");
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              isApp ? "bg-amber-400 text-black" : "border border-white/10 text-zinc-400"
            }`}
          >
            {tr("team_application_admins")}
          </button>
        </div>

        <p className="text-[11px] text-zinc-500">
          {isApp || audience === "PLATFORM"
            ? tr("platform_ping_hint")
            : tr("team_no_ping_hint")}
        </p>

        {!isApp && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setType("GENERAL")}
              className={`rounded-lg px-3 py-1 text-xs ${
                type === "GENERAL" ? "bg-white/10 text-white" : "text-zinc-500"
              }`}
            >
              {tr("general")}
            </button>
            <button
              type="button"
              onClick={() => setType("DISCORD")}
              className={`rounded-lg px-3 py-1 text-xs ${
                type === "DISCORD" ? "bg-white/10 text-white" : "text-zinc-500"
              }`}
            >
              {tr("discord")}
            </button>
          </div>
        )}

        {!isApp && (
          <>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={tr("subject")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
            />
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr("description")}
              className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
            />
            {type === "DISCORD" && (
              <input
                value={discordName}
                onChange={(e) => setDiscordName(e.target.value)}
                placeholder={tr("discord_name_optional")}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
              />
            )}
          </>
        )}

        {isApp && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={discordName}
              onChange={(e) => setDiscordName(e.target.value)}
              placeholder={tr("discord_name")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
            <input
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={tr("age")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none"
            />
            <input
              required
              value={applyAs}
              onChange={(e) => setApplyAs(e.target.value)}
              placeholder={tr("apply_as")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none"
            />
            <input
              required
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder={tr("availability")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
            <textarea
              required
              rows={2}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder={tr("about_you")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
            <textarea
              required
              rows={2}
              value={whyRole}
              onChange={(e) => setWhyRole(e.target.value)}
              placeholder={tr("why_role")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
            <textarea
              required
              rows={2}
              value={whyYou}
              onChange={(e) => setWhyYou(e.target.value)}
              placeholder={tr("why_you")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
            <textarea
              required
              rows={2}
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder={tr("contribution")}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none sm:col-span-2"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {submitting
            ? "…"
            : isApp
              ? tr("send_application")
              : audience === "PLATFORM"
                ? tr("send_to_admins")
                : tr("submit_ticket")}
        </button>
      </form>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-white">{tr("your_tickets")}</h2>
        <p className="mb-3 text-xs text-zinc-500">{tr("your_tickets_sub")}</p>
        {loading ? (
          <p className="text-zinc-500">{tr("loading_ellipsis")}</p>
        ) : tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{tr("no_tickets")}</p>
        ) : (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/dashboard/support/${ticket.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{ticket.subject}</p>
                    <p className="text-[11px] text-zinc-500">
                      {ticket.type === "TEAM_APPLICATION"
                        ? tr("team_application")
                        : ticket.type === "DISCORD"
                          ? tr("discord")
                          : tr("general")}
                      {ticket.audience === "PLATFORM" ? ` · ${tr("admin_ticket")}` : ""}
                      {" · "}
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      ticket.status === "CLOSED"
                        ? "bg-zinc-500/20 text-zinc-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {ticket.status === "CLOSED"
                      ? tr("ticket_closed")
                      : tr("ticket_open")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
