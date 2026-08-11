"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  type: string;
  status: string;
  audience?: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string };
  _count?: { messages: number };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "OPEN" | "CLOSED">("OPEN");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const q = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/support${q}`);
      if (res.ok) setTickets(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
        <h1 className="text-xl font-bold text-white sm:text-2xl">Admin-Tickets</h1>
        <p className="text-sm text-zinc-500">
          Nur Tickets an Platform-Admins · antworten, nicht neu erstellen
        </p>
      </div>

      <div className="flex gap-2">
        {(["OPEN", "CLOSED", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === f ? "bg-amber-400 text-black" : "bg-white/5 text-zinc-400"
            }`}
          >
            {f === "OPEN" ? "Offen" : f === "CLOSED" ? "Geschlossen" : "Alle"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        {loading && tickets.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500">Lade…</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">Keine Admin-Tickets</p>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/support/${t.id}`}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
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
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                      Admin
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.user.name || "—"} · {t.user.email}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {fmt(t.createdAt)}
                    {t._count?.messages != null && ` · ${t._count.messages} Nachrichten`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-amber-400">Antworten →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
