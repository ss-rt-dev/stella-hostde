"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
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
  const { t: tr } = useI18n();
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
      setError(d.error || tr("error"));
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

  async function save(memberId: string) {
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          role: isOwner ? editRole : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || tr("save_failed"));
        setSaving(false);
        return;
      }
      setEditId(null);
      setSaving(false);
      load();
    } catch {
      setError(tr("network_error"));
      setSaving(false);
    }
  }

  if (loading) return <p className="text-zinc-500">{tr("loading_ellipsis")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{tr("team_members")}</h1>
        <p className="text-sm text-zinc-500">{tr("team_members_sub")}</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <ul className="divide-y divide-white/5">
          {members.map((m) => {
            const editing = editId === m.id;
            return (
              <li key={m.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-100">{m.name || tr("no_name")}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${ROLE_COLOR[m.role] || "#71717a"}22`,
                          color: ROLE_COLOR[m.role] || "#a1a1aa",
                        }}
                      >
                        {m.role}
                      </span>
                      {m.title && (
                        <span className="text-xs text-zinc-500">{m.title}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{m.email}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {tr("open_tasks")}: {m.openTasks} · {tr("last_login")}:{" "}
                      {m.lastLoginAt
                        ? new Date(m.lastLoginAt).toLocaleString()
                        : tr("never")}
                    </p>
                  </div>
                  {canManage && m.role !== "OWNER" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(editing ? null : m.id);
                        setEditTitle(m.title || "");
                        setEditRole(m.role === "ADMIN" ? "ADMIN" : "MEMBER");
                      }}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                    >
                      {editing ? tr("close") : tr("save")}
                    </button>
                  )}
                </div>
                {editing && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="min-w-[140px] flex-1">
                      <label className="mb-1 block text-[11px] text-zinc-500">
                        {tr("team_title")}
                      </label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/40"
                      />
                    </div>
                    {isOwner && (
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-500">
                          {tr("role")}
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as "ADMIN" | "MEMBER")
                          }
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => save(m.id)}
                      className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {saving ? "…" : tr("save")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
