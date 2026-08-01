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
  messages: Message[];
}

export default function TicketChatPage() {
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
      setTicket(data);
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
      load();
    } finally {
      setSending(false);
    }
  }

  async function closeTicket() {
    if (!confirm("Schließen?")) return;
    const res = await fetch(`/api/support/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) load();
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/support" className="text-sm text-zinc-500 hover:text-amber-400">
          ← Zurück
        </Link>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-zinc-500">Lade…</p>;
  }

  const open = ticket.status === "OPEN";
  const isApp = ticket.type === "TEAM_APPLICATION";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/support"
            className="text-sm text-zinc-500 hover:text-amber-400"
          >
            ← Zurück
          </Link>
          <h1 className="mt-1 text-lg font-bold text-white">{ticket.subject}</h1>
          <p className="text-xs text-zinc-500">
            {isApp
              ? "Team-Bewerbung"
              : ticket.type === "SERVER"
                ? "Server Support"
                : "Support"}{" "}
            · {open ? "Offen" : "Geschlossen"}
          </p>
        </div>
        {open && (
          <button
            type="button"
            onClick={closeTicket}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            {isApp ? "Bewerbung schließen" : "Ticket schließen"}
          </button>
        )}
      </div>

      {isApp && (
        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/15 to-transparent p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-300">
            Bewerbungsdaten
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">Discord</p>
              <p className="font-medium text-white">{ticket.discordName || "—"}</p>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">Bewerbung als</p>
              <p className="font-medium text-purple-200">{ticket.applyRole || "—"}</p>
            </div>
          </div>
          {ticket.description && (
            <div className="mt-3 rounded-xl bg-black/30 px-3 py-2">
              <p className="mb-1 text-[10px] uppercase text-zinc-500">
                Erfahrung & Motivation
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {ticket.description}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {ticket.messages.map((m, idx) => {
            const isAppIntro = isApp && idx === 0 && !m.isStaff;
            return (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  m.isStaff
                    ? "ml-auto bg-amber-500/15 text-amber-100"
                    : isAppIntro
                      ? "border border-purple-500/20 bg-purple-500/10 text-zinc-100"
                      : "bg-white/5 text-zinc-200"
                }`}
              >
                <p className="mb-0.5 text-[10px] font-medium text-zinc-500">
                  {m.isStaff
                    ? `Team · ${m.user.name || "Admin"}`
                    : isAppIntro
                      ? "Deine Bewerbung"
                      : m.user.name || "Du"}{" "}
                  ·{" "}
                  {new Date(m.createdAt).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                  {m.body}
                </p>
              </div>
            );
          })}
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
                isApp ? "Nachfrage an das Team…" : "Nachricht schreiben…"
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
            Geschlossen – keine neuen Nachrichten
          </p>
        )}
      </div>
    </div>
  );
}
