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
    return <p className="text-zinc-500">Lade Server…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Stella Host · Infrastruktur
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Meine Server
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          LXC-Container erstellen, starten und verwalten.
        </p>
      </div>

      <form
        onSubmit={createServer}
        className="rounded-2xl border border-white/10 bg-[#111113] p-6 space-y-4"
      >
        <h2 className="font-medium">Neuen Server erstellen</h2>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {rootPassword && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-400">Server erstellt!</p>
            <p className="mt-1 text-zinc-300">
              Root-Passwort (nur einmal sichtbar):{" "}
              <code className="rounded bg-black/40 px-2 py-0.5 text-emerald-300">
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
              className="w-full rounded-xl border border-white/10 bg-[#060607] px-4 py-2.5 outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Paket</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#060607] px-4 py-2.5 outline-none focus:border-emerald-500/50"
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
          className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50 transition"
        >
          {creating ? "Wird erstellt…" : "Server erstellen"}
        </button>

        {!packages.length && (
          <p className="text-sm text-amber-400/90">
            Keine Pakete in der Datenbank. Bitte Seed ausführen oder im Admin
            Pakete anlegen.
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#111113] overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="font-medium">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-6 py-12 text-center text-zinc-500">
            Noch keine Server – erstelle oben deinen ersten Container.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {s.package.name}
                    {s.proxmoxVmid != null && ` · VMID ${s.proxmoxVmid}`}
                    {s.ipAddress && ` · ${s.ipAddress}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status === "STOPPED" && (
                    <button
                      onClick={() => action(s.id, "start")}
                      className="rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/25"
                    >
                      Start
                    </button>
                  )}
                  {s.status === "RUNNING" && (
                    <button
                      onClick={() => action(s.id, "stop")}
                      className="rounded-full bg-amber-500/15 px-3.5 py-1.5 text-sm text-amber-400 hover:bg-amber-500/25"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Server wirklich löschen?"))
                        action(s.id, "delete");
                    }}
                    className="rounded-full bg-red-500/15 px-3.5 py-1.5 text-sm text-red-400 hover:bg-red-500/25"
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
    CREATING: "bg-sky-500/20 text-sky-400",
    ERROR: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] || "bg-zinc-500/20 text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}
