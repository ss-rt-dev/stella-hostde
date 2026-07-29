"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  cpu: number;
  ramMb: number;
  diskGb: number;
  pricePerHour: string;
}

interface Server {
  id: string;
  name: string;
  status: string;
  ipAddress: string | null;
  proxmoxVmid: number | null;
  package: Package;
  createdAt: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hostname, setHostname] = useState("");
  const [packageId, setPackageId] = useState("");
  const [rootPassword, setRootPassword] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const [sRes, pRes] = await Promise.all([
      fetch("/api/servers"),
      fetch("/api/packages"),
    ]);
    if (sRes.ok) setServers(await sRes.json());
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

  async function createServer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setRootPassword(null);

    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, hostname }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error || "Fehler beim Erstellen");
      return;
    }

    setRootPassword(data.rootPassword);
    setHostname("");
    load();
  }

  async function action(id: string, act: "start" | "stop" | "delete") {
    const method = act === "delete" ? "DELETE" : "PATCH";
    const res = await fetch(`/api/servers/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: act !== "delete" ? JSON.stringify({ action: act }) : undefined,
    });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error || "Fehler");
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Lade…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Meine Server</h1>
        <p className="text-zinc-400">LXC-Container verwalten</p>
      </div>

      <form
        onSubmit={createServer}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
      >
        <h2 className="font-semibold">Neuen Server erstellen</h2>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {rootPassword && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-400">Server erstellt!</p>
            <p className="mt-1">
              Root-Passwort (nur einmal angezeigt):{" "}
              <code className="bg-zinc-950 px-2 py-0.5 rounded">
                {rootPassword}
              </code>
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Hostname</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={hostname}
              onChange={(e) => setHostname(e.target.value.toLowerCase())}
              placeholder="mein-server"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Paket</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 outline-none focus:border-emerald-500"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – {p.cpu} vCPU / {p.ramMb} MB / {p.diskGb} GB –{" "}
                  {formatCurrency(Number(p.pricePerHour))}/h
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating || !packages.length}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium hover:bg-emerald-500 disabled:opacity-50 transition"
        >
          {creating ? "Wird erstellt…" : "Server erstellen"}
        </button>
      </form>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-semibold">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-6 py-10 text-center text-zinc-500">
            Noch keine Server vorhanden
          </p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {s.package.name} · VMID {s.proxmoxVmid}
                    {s.ipAddress && ` · ${s.ipAddress}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {s.status === "STOPPED" && (
                    <button
                      onClick={() => action(s.id, "start")}
                      className="rounded-lg bg-emerald-600/20 text-emerald-400 px-3 py-1.5 text-sm hover:bg-emerald-600/30"
                    >
                      Start
                    </button>
                  )}
                  {s.status === "RUNNING" && (
                    <button
                      onClick={() => action(s.id, "stop")}
                      className="rounded-lg bg-amber-600/20 text-amber-400 px-3 py-1.5 text-sm hover:bg-amber-600/30"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Server wirklich löschen?"))
                        action(s.id, "delete");
                    }}
                    className="rounded-lg bg-red-600/20 text-red-400 px-3 py-1.5 text-sm hover:bg-red-600/30"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RUNNING: "bg-emerald-500/20 text-emerald-400",
    STOPPED: "bg-zinc-500/20 text-zinc-400",
    CREATING: "bg-blue-500/20 text-blue-400",
    ERROR: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] || "bg-zinc-500/20"
      }`}
    >
      {status}
    </span>
  );
}
