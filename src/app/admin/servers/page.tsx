"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  status: string;
  cpu: number | null;
  ramMb: number | null;
  diskGb: number | null;
  proxmoxVmid: number | null;
  accessSlug: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
};

export default function AdminServersPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/servers/list")
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
        <h1 className="text-xl font-bold text-white sm:text-2xl">Alle Server</h1>
        <p className="text-sm text-zinc-500">{list.length} aktiv</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Keine Server</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-600">
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Specs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-zinc-200">
                      {s.name}
                      {s.proxmoxVmid != null && (
                        <span className="ml-1 text-xs text-zinc-600">#{s.proxmoxVmid}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{s.user.email}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {s.cpu ?? "?"} / {s.ramMb ?? "?"}MB / {s.diskGb ?? "?"}GB
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.status === "RUNNING"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-500/15 text-zinc-400"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.accessSlug && (
                        <div className="flex gap-2 text-xs">
                          <Link
                            href={`/server/${s.accessSlug}/console`}
                            className="text-amber-400 hover:underline"
                          >
                            Console
                          </Link>
                          <Link
                            href={`/server/${s.accessSlug}/files`}
                            className="text-amber-400 hover:underline"
                          >
                            Files
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
