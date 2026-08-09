"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
  openTasks: number;
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "#ef4444",
  MODERATOR: "#22c55e",
  SUPPORTER: "#c026ff",
  VIP: "#eab308",
  SPONSOR: "#f97316",
  PARTNER: "#3b82f6",
  CUSTOMER: "#71717a",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team/members")
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members || []);
        setCanManage(Boolean(d.canManage));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Laden…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Mitglieder</h1>
          <p className="text-sm text-zinc-500">
            {members.length} Personen im Workspace
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Rollen verwalten
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="divide-y divide-white/5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{
                    backgroundColor: `${ROLE_COLOR[m.role] || "#71717a"}33`,
                    color: ROLE_COLOR[m.role] || "#a1a1aa",
                  }}
                >
                  {(m.name || m.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">
                    {m.name || "Ohne Name"}
                    <span
                      className="ml-2 text-[11px] font-semibold"
                      style={{ color: ROLE_COLOR[m.role] }}
                    >
                      {m.role}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">{m.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span>
                  {m.openTasks} offene Aufgabe{m.openTasks === 1 ? "" : "n"}
                </span>
                <span>
                  Login:{" "}
                  {m.lastLoginAt
                    ? new Date(m.lastLoginAt).toLocaleDateString("de-DE")
                    : "nie"}
                </span>
                <Link
                  href={`/dashboard/todos?scope=ALL`}
                  className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-medium text-amber-400"
                >
                  Todos
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
