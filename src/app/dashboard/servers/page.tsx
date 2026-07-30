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
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-500">Lade Server…</p>
      </div>
    );
  }

  const selectedPkg = packages.find((p) => p.id === packageId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-600">Dashboard</span>
            <span className="mx-1.5 text-zinc-700">›</span>
            <span className="text-amber-400/80">Virtual Servers</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Meine Server
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            LXC-Container erstellen, starten und verwalten.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {servers.length} Server aktiv
        </div>
      </div>

      {/* Create form */}
      <form
        onSubmit={createServer}
        className="rounded-2xl border border-white/8 bg-[#0e0e10] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Neuen Server erstellen</h2>
          {selectedPkg && (
            <span className="text-xs text-amber-400/80">
              Template: {templateLabel(selectedPkg.proxmoxTemplateId)}
            </span>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            {error}
          </p>
        )}

        {rootPassword && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-amber-400">Server erstellt!</p>
            <p className="mt-1 text-zinc-300">
              Root-Passwort (nur einmal sichtbar):{" "}
              <code className="rounded bg-black/40 px-2 py-0.5 text-amber-300">
                {rootPassword}
              </code>
            </p>
          </div>
        )}

        {/* Package cards */}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Paket wählen</label>
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
                      ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-white/8 bg-[#08080a] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${
                        selected ? "text-amber-400" : "text-zinc-200"
                      }`}
                    >
                      {p.name}
                    </span>
                    <span className="text-sm font-semibold text-amber-400">
                      {formatCurrency(Number(p.pricePerHour))}
                      <span className="text-xs font-normal text-zinc-500">/h</span>
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-md bg-white/5 px-2 py-0.5">
                      {p.cpu} vCPU
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5">
                      {p.ramMb >= 1024
                        ? `${(p.ramMb / 1024).toFixed(0)} GB RAM`
                        : `${p.ramMb} MB RAM`}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5">
                      {p.diskGb} GB Disk
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-600">
                    OS: {templateLabel(p.proxmoxTemplateId)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Hostname</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={hostname}
              onChange={(e) => setHostname(e.target.value.toLowerCase())}
              placeholder="mein-server"
              className="w-full rounded-xl border border-white/10 bg-[#08080a] px-4 py-2.5 text-sm outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || !packages.length}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50"
            >
              {creating ? "Wird erstellt…" : "Server erstellen"}
            </button>
          </div>
        </div>

        {!packages.length && (
          <p className="text-sm text-amber-400/90">
            Keine Pakete in der Datenbank. Bitte Seed ausführen oder im Admin
            Pakete anlegen.
          </p>
        )}
      </form>

      {/* Server list table */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10]">
        <div className="border-b border-white/8 px-5 py-4">
          <h2 className="font-medium">Active Services</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-5 py-14 text-center text-zinc-500">
            Noch keine Server – erstelle oben deinen ersten Container.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-zinc-600">
                  <th className="px-5 py-3 font-medium">No</th>
                  <th className="px-3 py-3 font-medium">Service Name</th>
                  <th className="px-3 py-3 font-medium">Package</th>
                  <th className="px-3 py-3 font-medium">IP / VMID</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {servers.map((s, i) => (
                  <tr key={s.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-zinc-500">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-zinc-200">
                      {s.name}
                    </td>
                    <td className="px-3 py-3.5 text-zinc-400">
                      {s.package.name}
                      <span className="ml-1 text-xs text-zinc-600">
                        {s.package.cpu}vCPU · {s.package.ramMb}MB
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-zinc-500">
                      {s.ipAddress || "—"}
                      {s.proxmoxVmid != null && (
                        <span className="ml-1 text-zinc-600">
                          · VMID {s.proxmoxVmid}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-zinc-300">
                      {formatCurrency(Number(s.package.pricePerHour))}
                      <span className="text-xs text-zinc-600">/h</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {s.status === "STOPPED" && (
                          <button
                            onClick={() => action(s.id, "start")}
                            className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/25"
                          >
                            Start
                          </button>
                        )}
                        {s.status === "RUNNING" && (
                          <button
                            onClick={() => action(s.id, "stop")}
                            className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/25"
                          >
                            Stop
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Server wirklich löschen?"))
                              action(s.id, "delete");
                          }}
                          className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/25"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function templateLabel(id?: string | null) {
  if (!id) return "Ubuntu 22.04";
  if (id.includes("debian")) return "Debian 12";
  if (id.includes("ubuntu-24")) return "Ubuntu 24.04";
  if (id.includes("ubuntu-22")) return "Ubuntu 22.04";
  if (id.includes("centos") || id.includes("rocky")) return "Rocky Linux";
  if (id.includes("alpine")) return "Alpine Linux";
  return id.split("/").pop()?.replace(/\.tar\.zst$/, "") || "Custom";
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RUNNING: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    STOPPED: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",
    CREATING: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    ERROR: "bg-red-500/15 text-red-400 ring-red-500/30",
  };
  const label: Record<string, string> = {
    RUNNING: "Active",
    STOPPED: "Paused",
    CREATING: "Creating",
    ERROR: "Error",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        colors[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {label[status] || status}
    </span>
  );
}
