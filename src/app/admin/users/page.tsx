"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLES, ROLE_LABELS, type AppRole, roleLabel, roleColor } from "@/lib/roles";

interface Activity {
  id: string;
  action: string;
  label: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

interface UserTeam {
  id: string;
  name: string;
  inviteCode: string;
  role: string;
  joinedAt: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp?: string | null;
  teams?: UserTeam[];
  activities?: Activity[];
  activityCount?: number;
}

const TEAM_ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "Noch nie";
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function relativeLogin(iso: string | null | undefined) {
  if (!iso) return "nie";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const days = Math.floor(h / 24);
  if (days < 14) return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  return fmtDate(iso);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("CUSTOMER");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const uRes = await fetch("/api/admin/users");
    if (uRes.ok) {
      const list = await uRes.json();
      setUsers(list);
      if (selected) {
        const updated = list.find((u: User) => u.id === selected.id);
        if (updated) {
          setSelected(updated);
          setName(updated.name || "");
          setEmail(updated.email);
        } else {
          setSelected(null);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function selectUser(u: User) {
    setSelected(u);
    setName(u.name || "");
    setEmail(u.email);
    setPassword("");
    setMsg("");
    setError("");
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg(`Nutzer ${data.email} erstellt`);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setShowCreate(false);
    load();
  }

  async function deleteUser() {
    if (!selected) return;
    if (!confirm(`Nutzer ${selected.email} wirklich löschen?`)) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, { method: "DELETE" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Nutzer gelöscht");
    setSelected(null);
    load();
  }

  async function saveProfile() {
    if (!selected) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", name, email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Profil gespeichert");
    load();
  }

  async function savePassword() {
    if (!selected || !password) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_password", password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Passwort geändert");
    setPassword("");
  }

  async function setRole(role: AppRole) {
    if (!selected) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_role", role }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg(`Rolle: ${roleLabel(role)}`);
    load();
  }

  if (loading) {
    return <p className="text-zinc-500">Lade Nutzer…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Nutzer</h1>
          <p className="text-sm text-zinc-500">Accounts, Teams, IP, Rollen, Aktivität</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
        >
          {showCreate ? "Schließen" : "+ Nutzer erstellen"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createUser}
          className="grid gap-3 rounded-2xl border border-amber-500/20 bg-[#121214] p-5 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 font-semibold text-white">Neuer Nutzer</h2>
          <input
            required
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <input
            required
            type="email"
            placeholder="E-Mail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Passwort (min. 6)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AppRole)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 sm:col-span-2"
          >
            Erstellen
          </button>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-zinc-300">
            Kunden ({users.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u)}
                className={`w-full border-b border-white/5 px-4 py-3 text-left transition ${
                  selected?.id === u.id
                    ? "border-l-2 border-l-amber-400 bg-amber-500/10"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <p className="truncate text-sm font-medium text-zinc-200">
                  {u.name || u.email}
                  <span
                    className="ml-1.5 text-[10px] font-semibold"
                    style={{ color: roleColor(u.role) }}
                  >
                    {roleLabel(u.role)}
                  </span>
                </p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
                <p className="mt-1 font-mono text-[11px] text-sky-400/90">
                  IP: {u.lastLoginIp || "—"}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500" title={fmtDate(u.lastLoginAt)}>
                  Login: {relativeLogin(u.lastLoginAt)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!selected ? (
            <div className="rounded-2xl border border-white/10 bg-[#121214] px-6 py-16 text-center text-sm text-zinc-500">
              Links einen Nutzer auswählen
            </div>
          ) : (
            <>
              {(msg || error) && (
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm ${
                    error
                      ? "border border-red-500/20 bg-red-500/10 text-red-400"
                      : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {error || msg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[#121214] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-600">Registriert</p>
                  <p className="mt-1 text-xs text-zinc-300">{fmtDate(selected.createdAt)}</p>
                </div>
                <div className="col-span-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:col-span-1">
                  <p className="text-[10px] uppercase tracking-wide text-amber-400/70">
                    Letzter Login
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {fmtDate(selected.lastLoginAt)}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {relativeLogin(selected.lastLoginAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-sky-400/70">IP-Adresse</p>
                  <p className="mt-1 break-all font-mono text-sm font-medium text-sky-300">
                    {selected.lastLoginIp || "noch keine"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#121214] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-600">Teams</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {(selected.teams || []).length}
                  </p>
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
                <div className="border-b border-white/5 px-5 py-3 font-semibold text-white">
                  Teams dieses Nutzers
                </div>
                {(selected.teams || []).length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-500">In keinem Team</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {(selected.teams || []).map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                      >
                        <div>
                          <p className="font-medium text-zinc-200">{t.name}</p>
                          <p className="text-xs text-zinc-500">
                            {TEAM_ROLE_LABEL[t.role] || t.role} · Code {t.inviteCode} · seit{" "}
                            {fmtDate(t.joinedAt)}
                          </p>
                        </div>
                        <Link
                          href={`/admin/teams/${t.id}`}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-white/5"
                        >
                          Team öffnen
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={deleteUser}
                  className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                >
                  Nutzer löschen
                </button>
              </div>

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
                <div className="border-b border-white/5 px-5 py-3 font-semibold text-white">
                  Aktivität (letzte 30)
                </div>
                {!selected.activities?.length ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-500">Noch keine Einträge</p>
                ) : (
                  <div className="max-h-64 divide-y divide-white/5 overflow-y-auto">
                    {selected.activities.map((a) => (
                      <div key={a.id} className="flex gap-3 px-5 py-2.5 text-sm">
                        <div className="w-[9.5rem] shrink-0 text-[11px] text-zinc-500">
                          {fmtDate(a.createdAt)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-200">{a.label}</p>
                          {a.detail && (
                            <p className="truncate text-xs text-zinc-500">{a.detail}</p>
                          )}
                          {a.ip && (
                            <p className="mt-0.5 font-mono text-[11px] text-sky-400/80">IP {a.ip}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5">
                <h2 className="font-semibold text-white">Profil & Rolle</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">E-Mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-zinc-500">Rolle</label>
                    <select
                      value={selected.role}
                      disabled={busy}
                      onChange={(e) => setRole(e.target.value as AppRole)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveProfile}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Profil speichern
                </button>
              </section>

              <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5">
                <h2 className="font-semibold text-white">Passwort ändern</h2>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Neues Passwort (min. 6)"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  disabled={busy || password.length < 6}
                  onClick={savePassword}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Passwort setzen
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
