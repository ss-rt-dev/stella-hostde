"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageEmbed } from "@/components/support/MessageEmbed";

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
  audience?: string;
  createdAt: string;
  user: { name: string | null; email: string };
  messages: Message[];
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
  const messages = ticket.messages || [];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/support" className="text-sm text-zinc-500 hover:text-amber-400">
            ← Admin-Tickets
          </Link>
          <h1 className="mt-1 text-lg font-bold text-white">{ticket.subject}</h1>
          <p className="text-xs text-zinc-500">
            {ticket.user?.name || "—"} · {ticket.user?.email}
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

      <div className="rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/15 to-transparent p-4">
        <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
          Platform Admin Ticket
        </span>
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-4 py-2.5">
          <p className="text-xs font-medium text-zinc-400">Nachrichten ({messages.length})</p>
        </div>
        <div className="max-h-[55vh] min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-600">Noch keine Nachrichten.</p>
          ) : (
            messages.map((m) => (
              <MessageEmbed
                key={m.id}
                body={m.body}
                userName={m.user?.name}
                userEmail={m.user?.email}
                isStaff={m.isStaff}
                createdAt={m.createdAt}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {open ? (
          <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Als Admin antworten…"
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
          <p className="border-t border-white/10 px-4 py-3 text-center text-xs text-zinc-500">Geschlossen</p>
        )}
      </div>
    </div>
  );
}
