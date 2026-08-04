"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { calcPricePerMonth, PRICING } from "@/lib/pricing";
import { applyDiscountSync } from "@/lib/discounts";
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
  const [showConfig, setShowConfig] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLDivElement>(null);

  const [creating, setCreating] = useState(false);
  const [hostname, setHostname] = useState("");
  const [cpu, setCpu] = useState(2);
  const [ramMb, setRamMb] = useState(2048);
  const [diskGb, setDiskGb] = useState(20);
  const [serverType, setServerType] = useState<ServerType>("DEBIAN");
  const [mcVariant, setMcVariant] = useState("paper");
  const [botVariant, setBotVariant] = useState("python");
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    valid: boolean;
    percent: number;
    message: string;
  }>({ valid: false, percent: 0, message: "" });
  const [rootPassword, setRootPassword] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [setupNote, setSetupNote] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Erweitern
  const [expandServer, setExpandServer] = useState<Server | null>(null);
  const [expandRam, setExpandRam] = useState(2048);
  const [expandDisk, setExpandDisk] = useState(20);
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState("");
  const [expandOk, setExpandOk] = useState("");

  const basePrice = useMemo(
    () => calcPricePerMonth(cpu, ramMb, diskGb),
    [cpu, ramMb, diskGb]
  );
  const percent = discountInfo.valid ? discountInfo.percent : 0;
  const price = applyDiscountSync(basePrice, percent);

  const expandDelta = useMemo(() => {
    if (!expandServer) return 0;
    const curCpu = expandServer.cpu ?? PRICING.minCpu;
    const curRam = expandServer.ramMb ?? PRICING.minRamMb;
    const curDisk = expandServer.diskGb ?? PRICING.minDiskGb;
    const oldP = calcPricePerMonth(curCpu, curRam, curDisk);
    const newP = calcPricePerMonth(curCpu, expandRam, expandDisk);
    return Math.round((newP - oldP) * 100) / 100;
  }, [expandServer, expandRam, expandDisk]);

  const expandNewPrice = useMemo(() => {
    if (!expandServer) return 0;
    const curCpu = expandServer.cpu ?? PRICING.minCpu;
    return calcPricePerMonth(curCpu, expandRam, expandDisk);
  }, [expandServer, expandRam, expandDisk]);

  useEffect(() => {
    const code = discountCode.trim();
    if (!code) {
      setDiscountInfo({ valid: false, percent: 0, message: "" });
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/discounts/validate?code=${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((d) =>
          setDiscountInfo({
            valid: Boolean(d.valid),
            percent: Number(d.percent) || 0,
            message: d.message || "",
          })
        )
        .catch(() =>
          setDiscountInfo({
            valid: false,
            percent: 0,
            message: "Prüfung fehlgeschlagen",
          })
        );
    }, 300);
    return () => clearTimeout(t);
  }, [discountCode]);

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

  function openConfigurator() {
    setShowConfig(true);
    setTimeout(() => {
      configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openExpand(s: Server) {
    setExpandServer(s);
    setExpandRam(s.ramMb ?? PRICING.minRamMb);
    setExpandDisk(s.diskGb ?? PRICING.minDiskGb);
    setExpandError("");
    setExpandOk("");
    setTimeout(() => {
      expandRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

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

  async function submitExpand(e: React.FormEvent) {
    e.preventDefault();
    if (!expandServer) return;
    setExpanding(true);
    setExpandError("");
    setExpandOk("");
    try {
      const res = await fetch(`/api/servers/${expandServer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resize",
          ramMb: expandRam,
          diskGb: expandDisk,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExpandError(data.error || `Fehler ${res.status}`);
        return;
      }
      setExpandOk(
        `Erweitert: ${formatCurrency(data.pricePerMonth)}/Monat` +
          (data.extraPerMonth > 0
            ? ` (+${formatCurrency(data.extraPerMonth)} Aufpreis)`
            : "")
      );
      load();
      setExpandServer((prev) =>
        prev
          ? {
              ...prev,
              ramMb: data.ramMb,
              diskGb: data.diskGb,
              pricePerHour: String(data.pricePerMonth),
            }
          : null
      );
    } catch (err: any) {
      setExpandError(err?.message || "Netzwerkfehler");
    } finally {
      setExpanding(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Server</h1>
          <p className="text-sm text-zinc-500">
            {servers.length === 0
              ? "Noch keine Server"
              : `${servers.length} Server`}
          </p>
        </div>
        {!showConfig && (
          <button
            type="button"
            onClick={openConfigurator}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20"
          >
            + Server kaufen
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Deine Server</h2>
        </div>
        {servers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-500">Du hast noch keinen Server.</p>
            <button
              type="button"
              onClick={openConfigurator}
              className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
            >
              Jetzt Server kaufen
            </button>
          </div>
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
                  {(s.status === "RUNNING" || s.status === "STOPPED") && (
                    <button
                      type="button"
                      onClick={() => openExpand(s)}
                      className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-400"
                    >
                      Erweitern
                    </button>
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

      {!showConfig && (
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-[#121214] px-6 py-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            Brauchst du noch Server?
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Konfiguriere CPU, RAM und SSD und starte in wenigen Minuten.
          </p>
          <button
            type="button"
            onClick={openConfigurator}
            className="mt-5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/25 transition hover:from-amber-300 hover:to-yellow-400"
          >
            Server kaufen
          </button>
        </div>
      )}

      {showConfig && (
        <div ref={configRef} className="page-slide-in scroll-mt-4">
          <form
            onSubmit={createServer}
            className="space-y-5 rounded-2xl border border-amber-500/20 bg-[#121214] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Server konfigurieren</h2>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Schließen
              </button>
            </div>

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
                {setupNote && <p className="text-xs text-zinc-400">{setupNote}</p>}
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
                placeholder="z.B. STELLA20"
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
        </div>
      )}

      {/* Erweitern – bleibt zusätzlich zum Erstellen-Panel */}
      {expandServer && (
        <div ref={expandRef} className="page-slide-in scroll-mt-4">
          <form
            onSubmit={submitExpand}
            className="space-y-5 rounded-2xl border border-sky-500/25 bg-[#121214] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">Server erweitern</h2>
                <p className="text-xs text-zinc-500">
                  {expandServer.name} · nur mehr RAM / SSD · Aufpreis pro Monat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandServer(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Schließen
              </button>
            </div>

            {expandError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {expandError}
              </p>
            )}
            {expandOk && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                {expandOk}
              </p>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">RAM</span>
                <span className="font-semibold text-sky-400">
                  {expandRam >= 1024
                    ? `${(expandRam / 1024).toFixed(expandRam % 1024 === 0 ? 0 : 1)} GB`
                    : `${expandRam} MB`}
                </span>
              </div>
              <input
                type="range"
                min={expandServer.ramMb ?? PRICING.minRamMb}
                max={PRICING.maxRamMb}
                step={512}
                value={expandRam}
                onChange={(e) => setExpandRam(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
              <p className="mt-1 text-[11px] text-zinc-600">
                Aktuell:{" "}
                {(expandServer.ramMb ?? 0) >= 1024
                  ? `${(expandServer.ramMb ?? 0) / 1024} GB`
                  : `${expandServer.ramMb ?? 0} MB`}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">SSD</span>
                <span className="font-semibold text-sky-400">{expandDisk} GB</span>
              </div>
              <input
                type="range"
                min={expandServer.diskGb ?? PRICING.minDiskGb}
                max={PRICING.maxDiskGb}
                step={10}
                value={expandDisk}
                onChange={(e) => setExpandDisk(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
              <p className="mt-1 text-[11px] text-zinc-600">
                Aktuell: {expandServer.diskGb ?? "?"} GB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
              <div>
                <p className="text-xs text-zinc-500">Neuer Monatspreis</p>
                <p className="text-2xl font-bold text-sky-400">
                  {formatCurrency(expandNewPrice)}
                  <span className="text-sm font-normal text-zinc-500">/Monat</span>
                </p>
                {expandDelta > 0 && (
                  <p className="text-xs text-amber-400">
                    +{formatCurrency(expandDelta)} Aufpreis (wird vom Guthaben
                    abgezogen)
                  </p>
                )}
                {expandDelta <= 0 && (
                  <p className="text-xs text-zinc-500">Keine Änderung</p>
                )}
              </div>
              <button
                type="submit"
                disabled={expanding || expandDelta <= 0}
                className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {expanding ? "Wird erweitert…" : "Erweiterung buchen"}
              </button>
            </div>
          </form>
        </div>
      )}
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
