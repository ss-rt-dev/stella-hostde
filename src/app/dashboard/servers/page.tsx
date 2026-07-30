"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  description?: string | null;
  cpu: number;
  ramMb: number;
  diskGb: number;
  pricePerHour: string;
  proxmoxTemplateId?: string;
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
    try {
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
    } catch {
      setError("API nicht erreichbar");
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

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, hostname }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server antwortete mit Status ${res.status}` };
      }

      if (!res.ok) {
        setError(data.error || `Fehler ${res.status}`);
        return;
      }

      setRootPassword(data.rootPassword);
      setHostname("");
      load();
    } catch (err: any) {
      setError(
        err?.message === "Failed to fetch"
          ? "Verbindung abgebrochen – oft Proxmox-Timeout oder fehlende Env-Vars. Prüfe Vercel-Logs."
          : err?.message || "Netzwerkfehler"
      );
    } finally {
      setCreating(false);
    }
  }

  async function action(id: string, act: "start" | "stop" | "delete") {
    try {
      const method = act === "delete" ? "DELETE" : "PATCH";
      const res = await fetch(`/api/servers/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: act !== "delete" ? JSON.stringify({ action: act }) : undefined,
      });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Fehler");
      }
    } catch (err: any) {
      alert(err?.message || "Netzwerkfehler");
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Lade Server…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Server</h1>
        <p className="text-sm text-zinc-500">LXC-Container erstellen und verwalten</p>
      </div>

      <form
        onSubmit={createServer}
        className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-4"
      >
        <h2 className="font-semibold text-white">Neuen Server erstellen</h2>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {rootPassword && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-400">Server erstellt!</p>
            <p className="mt-1 text-emerald-300/80">
              Root-Passwort:{" "}
              <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-emerald-400">
                {rootPassword}
              </code>
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => {
            const selected = packageId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selected ? "text-amber-400" : "text-zinc-200"}`}>
                    {p.name}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(Number(p.pricePerHour))}
                    <span className="text-xs font-normal text-zinc-500">/h</span>
                  </span>
                </div>
                {p.description && (
                  <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-500">
                  <span className="rounded-md bg-white/5 px-2 py-0.5">{p.cpu} vCPU</span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5">
                    {p.ramMb >= 1024 ? `${p.ramMb / 1024} GB` : `${p.ramMb} MB`}
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5">{p.diskGb} GB</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Hostname</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={hostname}
              onChange={(e) => setHostname(e.target.value.toLowerCase())}
              placeholder="mein-server"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || !packages.length}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {creating ? "Wird erstellt…" : "Server erstellen"}
            </button>
          </div>
        </div>

        {!packages.length && (
          <p className="text-sm text-amber-400">Keine Pakete – bitte Seed ausführen.</p>
        )}
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">Noch keine Server</p>
        ) : (
          <div className="divide-y divide-white/5">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{s.name}</span>
                    <StatusPill status={s.status} />
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
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400"
                    >
                      Start
                    </button>
                  )}
                  {s.status === "RUNNING" && (
                    <button
                      onClick={() => action(s.id, "stop")}
                      className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Server wirklich löschen?")) action(s.id, "delete");
                    }}
                    className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400"
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-500/15 text-emerald-400",
    STOPPED: "bg-zinc-500/15 text-zinc-400",
    CREATING: "bg-sky-500/15 text-sky-400",
    ERROR: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-zinc-500/15 text-zinc-400"}`}>
      {status}
    </span>
  );
}
