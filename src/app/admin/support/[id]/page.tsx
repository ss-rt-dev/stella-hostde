"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  user: { name: string | null; email: string; role: string };
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  type: string;
  status: string;
  discordName?: string | null;
  applyRole?: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
  messages: Message[];
}

function typeMeta(type: string) {
  if (type === "TEAM_APPLICATION") {
    return {
      label: "Team-Bewerbung",
      border: "border-purple-500/30",
      bg: "from-purple-500/20",
      accent: "text-purple-200",
      pill: "bg-purple-500/15 text-purple-300",
    };
  }
  if (type === "SERVER") {
    return {
      label: "Server Support",
      border: "border-amber-500/30",
      bg: "from-amber-500/15",
      accent: "text-amber-300",
      pill: "bg-amber-500/15 text-amber-400",
    };
  }
  return {
    label: "Support",
    border: "border-sky-500/30",
    bg: "from-sky-500/15",
    accent: "text-sky-300",
    pill: "bg-sky-500/15 text-sky-300",
  };
}

export default function AdminTicketPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setTicket({
        ...data,
        messages: Array.isArray(data.messages) ? data.messages : [],
      });
    } catch {
      setError("Netzwerkfehler");
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Fehler");
        return;
      }
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: "OPEN" | "CLOSED") {
    const res = await fetch(`/api/support/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <Link href="/admin/support" className="text-sm text-zinc-500 hover:text-amber-400">
          ← Support
        </Link>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!ticket) return <p className="text-zinc-500">Lade…</p>;

  const open = ticket.status === "OPEN";
  const isApp = ticket.type === "TEAM_APPLICATION";
  const meta = typeMeta(ticket.type);
  const messages = ticket.messages || [];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/support"
            className="text-sm text-zinc-500 hover:text-amber-400"
          >
            ← Support
          </Link>
          <h1 className="mt-1 text-lg font-bold text-white">{ticket.subject}</h1>
          <p className="text-xs text-zinc-500">
            {ticket.user?.name || "—"} · {ticket.user?.email} · {meta.label}
          </p>
        </div>
        <div className="flex gap-2">
          {open ? (
            <button
              type="button"
              onClick={() => setStatus("CLOSED")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Schließen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStatus("OPEN")}
              className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400"
            >
              Wieder öffnen
            </button>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border bg-gradient-to-br to-transparent p-4 ${meta.border} ${meta.bg}`}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.pill}`}>
            {meta.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              open
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-500/15 text-zinc-400"
            }`}
          >
            {open ? "Offen" : "Geschlossen"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {isApp && (
            <>
              <div className="rounded-xl bg-black/40 px-3 py-2">
                <p className="text-[10px] uppercase text-zinc-500">Discord</p>
                <p className="font-medium text-white">{ticket.discordName || "—"}</p>
              </div>
              <div className="rounded-xl bg-black/40 px-3 py-2">
                <p className="text-[10px] uppercase text-zinc-500">Rolle</p>
                <p className={`font-medium ${meta.accent}`}>{ticket.applyRole || "—"}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-4 py-2.5">
          <p className="text-xs font-medium text-zinc-400">
            Nachrichten ({messages.length})
          </p>
        </div>
        <div className="max-h-[55vh] min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-600">
              Noch keine Nachrichten – Antworte dem Nutzer hier.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm ${
                  m.isStaff
                    ? "ml-auto bg-amber-500/15 text-amber-100"
                    : "bg-white/5 text-zinc-200"
                }`}
              >
                <p className="mb-1 text-[10px] font-medium text-zinc-500">
                  {m.isStaff
                    ? `Team · ${m.user?.name || "Admin"}`
                    : m.user?.name || m.user?.email}{" "}
                  ·{" "}
                  {new Date(m.createdAt).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {open ? (
          <form
            onSubmit={send}
            className="flex gap-2 border-t border-white/10 p-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isApp ? "Antwort zur Bewerbung…" : "Als Team antworten…"
              }
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              Senden
            </button>
          </form>
        ) : (
          <p className="border-t border-white/10 px-4 py-3 text-center text-xs text-zinc-500">
            Geschlossen
          </p>
        )}
      </div>
    </div>
  );
}
