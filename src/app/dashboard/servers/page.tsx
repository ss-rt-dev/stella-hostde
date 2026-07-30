"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { calcPricePerHour, PRICING } from "@/lib/pricing";

interface Server {
  id: string;
  name: string;
  status: string;
  ipAddress: string | null;
  proxmoxVmid: number | null;
  cpu: number | null;
  ramMb: number | null;
  diskGb: number | null;
  pricePerHour: string | null;
  package: { name: string };
  createdAt: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hostname, setHostname] = useState("");
  const [cpu, setCpu] = useState(2);
  const [ramMb, setRamMb] = useState(2048);
  const [diskGb, setDiskGb] = useState(20);
  const [rootPassword, setRootPassword] = useState<string | null>(null);
  const [error, setError] = useState("");

  const price = useMemo(
    () => calcPricePerHour(cpu, ramMb, diskGb),
    [cpu, ramMb, diskGb]
  );

  async function load() {
    try {
      const sRes = await fetch("/api/servers");
      if (sRes.ok) setServers(await sRes.json());
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
        body: JSON.stringify({ hostname, cpu, ramMb, diskGb }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Status ${res.status}` };
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
          ? "Verbindung abgebrochen – Timeout oder Proxmox-Fehler."
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
        <p className="text-sm text-zinc-500">
          Debian 11 – CPU, RAM und SSD selbst konfigurieren
        </p>
      </div>

      <form
        onSubmit={createServer}
        className="rounded-2xl border border-white/10 bg-[#121214] p-5 space-y-5"
      >
        <h2 className="font-semibold text-white">Server konfigurieren</h2>

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

        {/* CPU */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">vCPU</span>
            <span className="font-semibold text-amber-400">{cpu} Kerne</span>
          </div>
          <input
            type="range"
            min={PRICING.minCpu}
            max={PRICING.maxCpu}
            step={1}
            value={cpu}
            onChange={(e) => setCpu(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>{PRICING.minCpu}</span>
            <span>{PRICING.maxCpu}</span>
          </div>
        </div>

        {/* RAM */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">RAM</span>
            <span className="font-semibold text-amber-400">
              {ramMb >= 1024 ? `${(ramMb / 1024).toFixed(ramMb % 1024 === 0 ? 0 : 1)} GB` : `${ramMb} MB`}
            </span>
          </div>
          <input
            type="range"
            min={PRICING.minRamMb}
            max={PRICING.maxRamMb}
            step={512}
            value={ramMb}
            onChange={(e) => setRamMb(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>512 MB</span>
            <span>32 GB</span>
          </div>
        </div>

        {/* Disk */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">SSD</span>
            <span className="font-semibold text-amber-400">{diskGb} GB</span>
          </div>
          <input
            type="range"
            min={PRICING.minDiskGb}
            max={PRICING.maxDiskGb}
            step={10}
            value={diskGb}
            onChange={(e) => setDiskGb(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>10 GB</span>
            <span>500 GB</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div>
            <p className="text-xs text-zinc-500">Preis pro Stunde</p>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(price)}
              <span className="text-sm font-normal text-zinc-500">/h</span>
            </p>
            <p className="text-[11px] text-zinc-600">
              ≈ {formatCurrency(price * 24 * 30)}/Monat (ca.)
            </p>
          </div>
          <button
            type="submit"
            disabled={creating || !hostname}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "Wird erstellt…" : "Server erstellen"}
          </button>
        </div>

        <p className="text-[11px] text-zinc-600">
          OS: <span className="text-zinc-400">Debian 11</span> · Abrechnung stündlich nach Konfiguration
        </p>
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
                    {s.cpu ?? "?"} vCPU ·{" "}
                    {s.ramMb
                      ? s.ramMb >= 1024
                        ? `${s.ramMb / 1024} GB`
                        : `${s.ramMb} MB`
                      : "?"}{" "}
                    RAM · {s.diskGb ?? "?"} GB SSD
                    {s.pricePerHour != null &&
                      ` · ${formatCurrency(Number(s.pricePerHour))}/h`}
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
