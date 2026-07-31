"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  action: string;
  label: string;
  detail: string | null;
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

export default function AdminActivityPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activities")
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
        <h1 className="text-xl font-bold text-white sm:text-2xl">Aktivitäten</h1>
        <p className="text-sm text-zinc-500">Globales Protokoll (letzte 150)</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Noch keine Einträge</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
            {list.map((a) => (
              <div key={a.id} className="flex gap-3 px-5 py-2.5 text-sm">
                <div className="w-[9.5rem] shrink-0 text-[11px] text-zinc-500">
                  {fmt(a.createdAt)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-200">{a.label}</p>
                  <p className="text-xs text-zinc-500">
                    {a.user.email}
                    {a.detail ? ` · ${a.detail}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
