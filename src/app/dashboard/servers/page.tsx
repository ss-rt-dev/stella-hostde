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
    return <p className="text-slate-400">Lade Server…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Server</h1>
        <p className="text-sm text-slate-400">LXC-Container erstellen und verwalten</p>
      </div>

      <form
        onSubmit={createServer}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4"
      >
        <h2 className="font-semibold text-slate-800">Neuen Server erstellen</h2>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        {rootPassword && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-700">Server erstellt!</p>
            <p className="mt-1 text-emerald-600">
              Root-Passwort:{" "}
              <code className="rounded bg-white px-2 py-0.5 font-mono text-emerald-800">
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
                    ? "border-[#3a57e8] bg-blue-50 ring-1 ring-[#3a57e8]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selected ? "text-[#3a57e8]" : "text-slate-700"}`}>
                    {p.name}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatCurrency(Number(p.pricePerHour))}
                    <span className="text-xs font-normal text-slate-400">/h</span>
                  </span>
                </div>
                {p.description && (
                  <p className="mt-1 text-xs text-slate-400">{p.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">{p.cpu} vCPU</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">
                    {p.ramMb >= 1024 ? `${p.ramMb / 1024} GB` : `${p.ramMb} MB`}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">{p.diskGb} GB</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Hostname</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={hostname}
              onChange={(e) => setHostname(e.target.value.toLowerCase())}
              placeholder="mein-server"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3a57e8] focus:ring-2 focus:ring-[#3a57e8]/20"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || !packages.length}
              className="w-full rounded-xl bg-[#3a57e8] py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#2f4ad0] disabled:opacity-50 transition"
            >
              {creating ? "Wird erstellt…" : "Server erstellen"}
            </button>
          </div>
        </div>

        {!packages.length && (
          <p className="text-sm text-amber-600">Keine Pakete – bitte Seed ausführen.</p>
        )}
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">Noch keine Server</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {s.package.name}
                    {s.proxmoxVmid != null && ` · VMID ${s.proxmoxVmid}`}
                    {s.ipAddress && ` · ${s.ipAddress}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status === "STOPPED" && (
                    <button
                      onClick={() => action(s.id, "start")}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100"
                    >
                      Start
                    </button>
                  )}
                  {s.status === "RUNNING" && (
                    <button
                      onClick={() => action(s.id, "stop")}
                      className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Server wirklich löschen?")) action(s.id, "delete");
                    }}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
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
    RUNNING: "bg-emerald-50 text-emerald-600",
    STOPPED: "bg-slate-100 text-slate-500",
    CREATING: "bg-sky-50 text-sky-600",
    ERROR: "bg-red-50 text-red-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}
