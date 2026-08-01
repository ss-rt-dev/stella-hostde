"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { ROLES, ROLE_LABELS, type AppRole, roleLabel } from "@/lib/roles";

interface Server {
  id: string;
  name: string;
  status: string;
  proxmoxVmid: number | null;
  cpu?: number | null;
  ramMb?: number | null;
  diskGb?: number | null;
  package: { id: string; name: string; pricePerHour: string };
}

interface Activity {
  id: string;
  action: string;
  label: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  balance: number;
  createdAt: string;
  lastLoginAt: string | null;
  servers: Server[];
  activities?: Activity[];
  activityCount?: number;
}

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
  const [creditAmount, setCreditAmount] = useState("10");
  const [hostname, setHostname] = useState("");
  const [cpu, setCpu] = useState(2);
  const [ramMb, setRamMb] = useState(2048);
  const [diskGb, setDiskGb] = useState(20);
  const [free, setFree] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rootPw, setRootPw] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("CUSTOMER");
  const [newBalance, setNewBalance] = useState("0");
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
    setRootPw(null);
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
        balance: Number(newBalance) || 0,
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
    setNewBalance("0");
    setShowCreate(false);
    load();
  }

  async function deleteUser() {
    if (!selected) return;
    if (
      !confirm(
        `Nutzer ${selected.email} wirklich löschen? Server werden als gelöscht markiert.`
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: "DELETE",
    });
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

  async function loginAsUser() {
    if (!selected) return;
    if (!confirm(`Als ${selected.email} anmelden?`)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    await signIn("credentials", {
      impersonateToken: data.token,
      redirect: true,
      callbackUrl: "/dashboard",
    });
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

  async function addCredit(sign: 1 | -1) {
    if (!selected) return;
    const amount = sign * Math.abs(Number(creditAmount));
    if (!amount) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "credit", amount }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg(`Guthaben aktualisiert: ${data.balance} €`);
    load();
  }

  async function assignServer(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setRootPw(null);
    const res = await fetch("/api/admin/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected.id,
        hostname,
        cpu,
        ramMb,
        diskGb,
        free,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setRootPw(data.rootPassword);
    setMsg(`Server ${data.hostname} zugewiesen (VMID ${data.vmid})`);
    setHostname("");
    load();
  }

  async function cancelServer(serverId: string) {
    if (!confirm("Server wirklich kündigen/löschen?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/servers/${serverId}`, { method: "DELETE" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Server gekündigt");
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
          <p className="text-sm text-zinc-500">
            Login, Aktivität, Guthaben, Server, Rollen
          </p>
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
          <input
            type="number"
            step="0.01"
            min={0}
            placeholder="Start-Guthaben"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
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
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Erstellen
          </button>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden max-h-[70vh] flex flex-col">
          <div className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-zinc-300">
            Kunden ({users.length})
          </div>
          <div className="overflow-y-auto flex-1">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u)}
                className={`w-full border-b border-white/5 px-4 py-3 text-left transition ${
                  selected?.id === u.id
                    ? "bg-amber-500/10 border-l-2 border-l-amber-400"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <p className="truncate text-sm font-medium text-zinc-200">
                  {u.name || u.email}
                  {u.role !== "CUSTOMER" && (
                    <span className="ml-1.5 text-[10px] text-amber-400">
                      {roleLabel(u.role)}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="text-amber-400/80">{u.balance.toFixed(2)} €</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500" title={fmtDate(u.lastLoginAt)}>
                    Login: {relativeLogin(u.lastLoginAt)}
                  </span>
                </div>
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
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {error || msg}
                </div>
              )}

              {rootPw && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Root-Passwort (nur einmal):{" "}
                  <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-amber-400">
                    {rootPw}
                  </code>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[#121214] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-600">Registriert</p>
                  <p className="mt-1 text-xs text-zinc-300">{fmtDate(selected.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 col-span-1 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wide text-amber-400/70">
                    Letzter Login
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {fmtDate(selected.lastLoginAt)}
                  </p>
                  <p className="text-[11px] text-zinc-500">{relativeLogin(selected.lastLoginAt)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#121214] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-600">Aktivitäten</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {selected.activityCount ?? selected.activities?.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={loginAsUser}
                  className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/30 disabled:opacity-50"
                >
                  Als Nutzer anmelden
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={deleteUser}
                  className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                >
                  Nutzer löschen
                </button>
              </div>

              <section className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
                <div className="border-b border-white/5 px-5 py-3 font-semibold text-white">
                  Aktivität (letzte 30)
                </div>
                {!selected.activities?.length ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-500">
                    Noch keine Einträge – erscheinen nach dem nächsten Login / Aktionen
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
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

              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
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

              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
                <h2 className="font-semibold text-white">
                  Guthaben{" "}
                  <span className="text-amber-400">{selected.balance.toFixed(2)} €</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addCredit(1)}
                    className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    + Gutschreiben
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addCredit(-1)}
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    − Abziehen
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
                <h2 className="font-semibold text-white">Server zuweisen</h2>
                <form onSubmit={assignServer} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Hostname</label>
                    <input
                      required
                      pattern="[a-z0-9-]+"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value.toLowerCase())}
                      placeholder="kunde-server"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">vCPU</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={cpu}
                        onChange={(e) => setCpu(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">RAM (MB)</label>
                      <input
                        type="number"
                        min={512}
                        max={32768}
                        step={512}
                        value={ramMb}
                        onChange={(e) => setRamMb(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">SSD (GB)</label>
                      <input
                        type="number"
                        min={10}
                        max={250}
                        step={10}
                        value={diskGb}
                        onChange={(e) => setDiskGb(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      checked={free}
                      onChange={(e) => setFree(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Kostenlos zuweisen
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    Server zuweisen
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
                <div className="border-b border-white/5 px-5 py-3 font-semibold text-white">
                  Server dieses Nutzers
                </div>
                {selected.servers.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-500">Keine Server</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {selected.servers.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-200">
                            {s.name}{" "}
                            <span className="text-xs text-zinc-500">({s.status})</span>
                          </p>
                          <p className="text-xs text-zinc-500">
                            {s.cpu ?? "?"}vCPU · {s.ramMb ?? "?"}MB · {s.diskGb ?? "?"}GB
                            {s.proxmoxVmid != null && ` · VMID ${s.proxmoxVmid}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => cancelServer(s.id)}
                          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          Kündigen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
