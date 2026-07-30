"use client";

import { useEffect, useState } from "react";

interface Server {
  id: string;
  name: string;
  status: string;
  proxmoxVmid: number | null;
  package: { id: string; name: string; pricePerHour: string };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  balance: number;
  createdAt: string;
  servers: Server[];
}

interface Package {
  id: string;
  name: string;
  cpu: number;
  ramMb: number;
  diskGb: number;
  pricePerHour: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // forms
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creditAmount, setCreditAmount] = useState("10");
  const [hostname, setHostname] = useState("");
  const [packageId, setPackageId] = useState("");
  const [free, setFree] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rootPw, setRootPw] = useState<string | null>(null);

  async function load() {
    const [uRes, pRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/packages"),
    ]);
    if (uRes.ok) {
      const list = await uRes.json();
      setUsers(list);
      if (selected) {
        const updated = list.find((u: User) => u.id === selected.id);
        if (updated) {
          setSelected(updated);
          setName(updated.name || "");
          setEmail(updated.email);
        }
      }
    }
    if (pRes.ok) {
      const pkgs = await pRes.json();
      setPackages(pkgs);
      if (pkgs.length && !packageId) setPackageId(pkgs[0].id);
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
        packageId,
        hostname,
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
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Nutzer</h1>
        <p className="text-sm text-zinc-500">
          Guthaben, Server zuweisen, kündigen, Profil & Passwort
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* User list – left */}
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
                  {u.role === "ADMIN" && (
                    <span className="ml-1.5 text-[10px] text-amber-400">ADMIN</span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
                <p className="mt-0.5 text-xs text-amber-400/80">{u.balance.toFixed(2)} €</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
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

              {/* Profile */}
              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
                <h2 className="font-semibold text-white">Profil</h2>
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
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveProfile}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Speichern
                </button>
              </section>

              {/* Password */}
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

              {/* Credit */}
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

              {/* Assign server */}
              <section className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-3">
                <h2 className="font-semibold text-white">Server zuweisen</h2>
                <form onSubmit={assignServer} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
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
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Paket</label>
                      <select
                        value={packageId}
                        onChange={(e) => setPackageId(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                      >
                        {packages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.cpu}vCPU)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      checked={free}
                      onChange={(e) => setFree(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Kostenlos zuweisen (kein Guthaben abziehen)
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !packages.length}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    Server zuweisen
                  </button>
                </form>
              </section>

              {/* Servers of user */}
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
                            {s.package.name}
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
