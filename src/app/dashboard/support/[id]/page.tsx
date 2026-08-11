"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import Link from "next/link";
import { useParams } from "next/navigation";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
  };
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  type: string;
  audience?: string;
  messages: Msg[];
};

export default function SupportTicketPage() {
  const { t: tr } = useI18n();
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/support/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || tr("error"));
      setLoading(false);
      return;
    }
    setTicket(data.ticket);
    setLoading(false);
  }, [id, tr]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tr("error"));
        setSending(false);
        return;
      }
      setBody("");
      setSending(false);
      load();
    } catch {
      setError(tr("network_error"));
      setSending(false);
    }
  }

  async function setStatus(status: string) {
    if (status === "CLOSED" && !confirm(tr("close_ticket_confirm"))) return;
    const res = await fetch(`/api/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  if (loading) return <p className="text-zinc-500">{tr("loading_ellipsis")}</p>;
  if (!ticket) return <p className="text-red-400">{error || tr("error")}</p>;

  const closed = ticket.status === "CLOSED";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard/support" className="text-sm text-amber-400 hover:underline">
          {tr("back")}
        </Link>
        <div className="flex gap-2">
          {!closed ? (
            <button
              type="button"
              onClick={() => setStatus("CLOSED")}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              {tr("close")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStatus("OPEN")}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              {tr("reopen")}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214] p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-white">{ticket.subject}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              closed
                ? "bg-zinc-500/20 text-zinc-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {closed ? tr("ticket_closed") : tr("ticket_open")}
          </span>
          {ticket.audience === "PLATFORM" && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">
              {tr("platform_admin_ticket")}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {ticket.type} · {ticket.messages?.length || 0} {tr("messages_count")}
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        {(ticket.messages || []).map((m) => {
          const isJustin = m.user.email === "justin@stella-host.de";
          return (
            <div
              key={m.id}
              className={`msg-embed relative overflow-hidden rounded-xl border border-white/10 bg-[#16161a] p-4 ${
                isJustin ? "msg-embed-rainbow" : ""
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-zinc-200">
                  {m.user.name || m.user.email}
                </span>
                {m.user.role && (
                  <span className="text-zinc-500">{m.user.role}</span>
                )}
                <span className="text-zinc-600">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{m.body}</p>
            </div>
          );
        })}
      </div>

      {!closed && (
        <form onSubmit={send} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={tr("write_reply")}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/40"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {tr("send")}
          </button>
        </form>
      )}
    </div>
  );
}
