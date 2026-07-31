"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { calcPricePerMonth, PRICING } from "@/lib/pricing";
import { applyDiscount, validateDiscountCode } from "@/lib/discounts";
import {
  MINECRAFT_VARIANTS,
  DISCORD_VARIANTS,
} from "@/lib/software-variants";

interface Server {
  id: string;
  accessSlug: string;
  name: string;
  status: string;
  ipAddress: string | null;
  proxmoxVmid: number | null;
  cpu: number | null;
  ramMb: number | null;
  diskGb: number | null;
  pricePerHour: string | null;
  serverType?: string;
  softwareVariant?: string | null;
  discountCode?: string | null;
  setupStatus?: string | null;
  package: { name: string };
  createdAt: string;
}

type ServerType = "DEBIAN" | "MINECRAFT" | "DISCORD_BOT";

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hostname, setHostname] = useState("");
  const [cpu, setCpu] = useState(2);
  const [ramMb, setRamMb] = useState(2048);
  const [diskGb, setDiskGb] = useState(20);
  const [serverType, setServerType] = useState<ServerType>("DEBIAN");
  const [mcVariant, setMcVariant] = useState("paper");
  const [botVariant, setBotVariant] = useState("python");
  const [discountCode, setDiscountCode] = useState("");
  const [rootPassword, setRootPassword] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [setupNote, setSetupNote] = useState<string | null>(null);
  const [error, setError] = useState("");

  const basePrice = useMemo(
    () => calcPricePerMonth(cpu, ramMb, diskGb),
    [cpu, ramMb, diskGb]
  );
  const discountInfo = useMemo(
    () => validateDiscountCode(discountCode),
    [discountCode]
  );
  const { price, percent } = useMemo(
    () => applyDiscount(basePrice, discountCode),
    [basePrice, discountCode]
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
    setCreatedSlug(null);
    setSetupNote(null);

    const softwareVariant =
      serverType === "MINECRAFT"
        ? mcVariant
        : serverType === "DISCORD_BOT"
          ? botVariant
          : undefined;

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname,
          cpu,
          ramMb,
          diskGb,
          serverType,
          softwareVariant,
          discountCode: discountCode.trim() || undefined,
        }),
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
      setCreatedSlug(data.accessSlug);
      setSetupNote(data.setupNote || null);
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
          Debian · Minecraft · Discord-Bot · Abrechnung pro Monat
        </p>
      </div>

      <form
        onSubmit={createServer}
        className="space-y-5 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">Server konfigurieren</h2>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {rootPassword && (
          <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-400">Server erstellt!</p>
            <p className="text-emerald-300/80">
              Root-Passwort:{" "}
              <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-emerald-400">
                {rootPassword}
              </code>
            </p>
            {setupNote && (
              <p className="text-xs text-zinc-400">{setupNote}</p>
            )}
            {createdSlug && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/server/${createdSlug}/console`}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black"
                >
                  Console
                </Link>
                <Link
                  href={`/server/${createdSlug}/files`}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
                >
                  Dateien
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Server-Typ */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">
            Server-Typ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["DEBIAN", "Debian 12"],
                ["MINECRAFT", "Minecraft"],
                ["DISCORD_BOT", "Discord Bot"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setServerType(id)}
                className={`rounded-xl py-2.5 text-sm font-medium transition ${
                  serverType === id
                    ? "bg-amber-400 text-black"
                    : "border border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {serverType === "MINECRAFT" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500">
              Minecraft-Version / Engine
            </label>
            <div className="flex flex-wrap gap-2">
              {MINECRAFT_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setMcVariant(v.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    mcVariant === v.id
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Java wird installiert, Server-JAR automatisch geladen, eula
              akzeptiert, systemd-Service gestartet.
            </p>
          </div>
        )}

        {serverType === "DISCORD_BOT" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500">
              Runtime
            </label>
            <div className="flex flex-wrap gap-2">
              {DISCORD_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setBotVariant(v.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    botVariant === v.id
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Vorlage + Dependencies. Danach in der Console{" "}
              <code className="text-zinc-500">DISCORD_TOKEN</code> in{" "}
              <code className="text-zinc-500">/opt/discord-bot/.env</code> setzen.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Hostname
          </label>
          <input
            required
            pattern="[a-z0-9-]+"
            value={hostname}
            onChange={(e) => setHostname(e.target.value.toLowerCase())}
            placeholder="mein-server"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>

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
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">RAM</span>
            <span className="font-semibold text-amber-400">
              {ramMb >= 1024
                ? `${(ramMb / 1024).toFixed(ramMb % 1024 === 0 ? 0 : 1)} GB`
                : `${ramMb} MB`}
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
        </div>

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
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Rabattcode (optional)
          </label>
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="z.B. NEXUS-10"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          {discountCode && (
            <p
              className={`mt-1.5 text-xs ${
                discountInfo.valid ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {discountInfo.valid
                ? `✓ ${discountInfo.message}`
                : discountInfo.message || "Ungültiger Code"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div>
            <p className="text-xs text-zinc-500">Preis pro Monat</p>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(price)}
              <span className="text-sm font-normal text-zinc-500">/Monat</span>
            </p>
            {percent > 0 && (
              <p className="text-xs text-emerald-400">
                Statt {formatCurrency(basePrice)} (−{percent}%)
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={creating || !hostname}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "Wird erstellt…" : "Server erstellen"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">
            Noch keine Server
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-200">{s.name}</span>
                    <StatusPill status={s.status} />
                    {s.serverType && s.serverType !== "DEBIAN" && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                        {s.serverType}
                        {s.softwareVariant ? ` · ${s.softwareVariant}` : ""}
                      </span>
                    )}
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
                      ` · ${formatCurrency(Number(s.pricePerHour))}/Monat`}
                    {s.discountCode && ` · ${s.discountCode}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.accessSlug && s.status === "RUNNING" && (
                    <>
                      <Link
                        href={`/server/${s.accessSlug}/console`}
                        className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400"
                      >
                        Console
                      </Link>
                      <Link
                        href={`/server/${s.accessSlug}/files`}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300"
                      >
                        Dateien
                      </Link>
                    </>
                  )}
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
                      className="rounded-lg bg-zinc-500/15 px-3 py-1.5 text-xs font-medium text-zinc-400"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Server wirklich löschen?"))
                        action(s.id, "delete");
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
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}
