"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/transactions")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setList(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Lade…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Transaktionen</h1>
        <p className="text-sm text-zinc-500">Letzte 100 Einträge</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Keine</p>
        ) : (
          <div className="divide-y divide-white/5">
            {list.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-zinc-200">{t.description || t.type}</p>
                  <p className="text-xs text-zinc-500">
                    {t.user.email} · {fmt(t.createdAt)}
                  </p>
                </div>
                <span
                  className={
                    t.amount >= 0 ? "font-medium text-amber-400" : "font-medium text-red-400"
                  }
                >
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
