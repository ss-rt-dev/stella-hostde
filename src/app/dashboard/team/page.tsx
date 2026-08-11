"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  title: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  openTasks: number;
};

const ROLE_COLOR: Record<string, string> = {
  OWNER: "#f59e0b",
  ADMIN: "#ef4444",
  MEMBER: "#71717a",
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/team/members");
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Fehler");
      setLoading(false);
      return;
    }
    setMembers(d.members || []);
    setCanManage(Boolean(d.canManage));
    setIsOwner(Boolean(d.isOwner));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(m: Member) {
    if (m.role === "OWNER") return;
    setEditId(m.id);
    setEditTitle(m.title || "");
    setEditRole(m.role === "ADMIN" ? "ADMIN" : "MEMBER");
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/members/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          title: editTitle.trim() || null,
        }),
      });
      if (res.ok) {
        setEditId(null);
        await load();
      } else {
        const d = await res.json();
        setError(d.error || "Speichern fehlgeschlagen");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-zinc-500">Laden…</p>;

  if (error && members.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/dashboard/teams" className="mt-3 inline-block text-sm text-amber-400">
          Team wählen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Mitglieder</h1>
          <p className="text-sm text-zinc-500">
            Team-Rollen nur hier sichtbar · Dashboard zeigt immer „Mitglied“
          </p>
        </div>
        {isOwner && (
          <p className="text-xs text-amber-400/80">
            Als Owner kannst du Titel & Rechte setzen
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="divide-y divide-white/5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
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
                    {m.title && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                        {m.title}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{m.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span>
                  {m.openTasks} offene Aufgabe{m.openTasks === 1 ? "" : "n"}
                </span>
                {isOwner && m.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400"
                  >
                    Rolle bearbeiten
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5">
            <h2 className="font-semibold text-white">Team-Rolle setzen</h2>
            <p className="text-xs text-zinc-500">
              Der Anzeige-Titel gilt nur in diesem Team. Die globale Dashboard-Rolle
              bleibt „Mitglied“.
            </p>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Anzeige-Titel (z.B. Moderator, Designer)
              </label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Optional"
                maxLength={40}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Rechte</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
