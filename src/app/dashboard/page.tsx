import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      servers: {
        where: { status: { not: "DELETED" } },
        include: { package: true },
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  const running = user.servers.filter((s) => s.status === "RUNNING").length;
  const paused = user.servers.filter((s) => s.status === "STOPPED").length;
  const total = user.servers.length;
  const firstName = user.name?.split(" ")[0] || "Dev";

  function fakeCpu(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 100;
    return 25 + (h % 70);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(20,18,10,0.9) 50%, rgba(12,12,14,0.95) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(245,200,50,0.25), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-3xl">
              👋 Hello {firstName}!
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-zinc-400">
              Verwalte Server, Guthaben und Zahlungen an einem Ort.
            </p>
          </div>
          <Link
            href="/dashboard/servers"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition active:scale-[0.98] hover:bg-white/15"
          >
            ⚡ Server erstellen
          </Link>
        </div>
      </div>

      {/* Stat cards – 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          emoji="💰"
          label="Guthaben"
          value={formatCurrency(Number(user.balance))}
          percent={Math.min(100, Math.round(Number(user.balance) / 10))}
          color="amber"
          href="/dashboard/deposit"
        />
        <StatCard
          emoji="🖥️"
          label="Server"
          value={String(total)}
          percent={total === 0 ? 0 : 100}
          color="white"
          href="/dashboard/servers"
        />
        <StatCard
          emoji="🟢"
          label="Online"
          value={String(running)}
          percent={total === 0 ? 0 : Math.round((running / total) * 100)}
          color="emerald"
          href="/dashboard/servers"
        />
        <StatCard
          emoji="⏸️"
          label="Gestoppt"
          value={String(paused)}
          percent={total === 0 ? 0 : Math.round((paused / total) * 100)}
          color="zinc"
          href="/dashboard/servers"
        />
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active services */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-white">
              📡 Active Services
            </h2>
            <Link
              href="/dashboard/servers"
              className="rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-xs font-semibold text-black"
            >
              + Neu
            </Link>
          </div>

          {user.servers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl">📭</p>
              <p className="mt-2 text-sm text-zinc-500">Noch keine Server</p>
              <Link
                href="/dashboard/servers"
                className="mt-2 inline-block text-sm text-amber-400 hover:underline"
              >
                Ersten Server erstellen →
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="divide-y divide-white/5 sm:hidden">
                {user.servers.map((s) => {
                  const cpu = fakeCpu(s.id);
                  return (
                    <div key={s.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-200">{s.name}</p>
                          <p className="text-xs text-zinc-500">
                            {s.package.name} ·{" "}
                            {formatCurrency(Number(s.package.pricePerHour))}/h
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
                            {s.ipAddress || "keine IP"}
                          </p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                            style={{ width: `${cpu}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-500">{cpu}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-3 font-medium">Service</th>
                      <th className="px-3 py-3 font-medium">IP</th>
                      <th className="px-3 py-3 font-medium">CPU</th>
                      <th className="px-3 py-3 font-medium">Preis</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {user.servers.map((s) => {
                      const cpu = fakeCpu(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🖥️</span>
                              <div>
                                <p className="font-medium text-zinc-200">
                                  {s.name}
                                </p>
                                <p className="text-[11px] text-zinc-600">
                                  {s.package.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-zinc-500">
                            {s.ipAddress || "—"}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                                  style={{ width: `${cpu}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-zinc-500">
                                {cpu}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-zinc-300">
                            {formatCurrency(Number(s.package.pricePerHour))}
                            <span className="text-[11px] text-zinc-600">/h</span>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusBadge status={s.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Side column */}
        <div className="space-y-4">
          <div
            className="rounded-2xl border border-amber-500/20 p-5"
            style={{
              background:
                "linear-gradient(145deg, rgba(212,175,55,0.15), rgba(20,18,10,0.8))",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70">
              💎 Premium Account
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">
              {formatCurrency(Number(user.balance))}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Verfügbares Guthaben</p>
            <Link
              href="/dashboard/deposit"
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition active:scale-[0.98] hover:from-amber-300 hover:to-yellow-400"
            >
              💳 Guthaben aufladen
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="border-b border-white/8 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">
                📋 Transaktionen
              </h2>
            </div>
            {user.transactions.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-600">
                Keine Bewegungen
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {user.transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs text-zinc-300">
                        {t.description || t.type}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {new Date(t.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        Number(t.amount) >= 0
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {Number(t.amount) >= 0 ? "+" : ""}
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product cards */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <ProductCard
          emoji="☁️"
          title="Cloud Server"
          desc="Skalierbare VMs an verschiedenen Standorten."
          href="/dashboard/servers"
        />
        <ProductCard
          emoji="🔒"
          title="Dedicated Server"
          desc="Maximale Performance und volle Kontrolle."
          href="/dashboard/servers"
        />
        <ProductCard
          emoji="💾"
          title="Storage"
          desc="Sicherer Speicher für große Datenmengen."
          href="/dashboard/servers"
        />
      </div>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
  percent,
  color,
  href,
}: {
  emoji: string;
  label: string;
  value: string;
  percent: number;
  color: "amber" | "emerald" | "white" | "zinc";
  href: string;
}) {
  const stroke =
    color === "amber"
      ? "#f59e0b"
      : color === "emerald"
        ? "#34d399"
        : color === "white"
          ? "#e4e4e7"
          : "#71717a";

  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;

  return (
    <Link
      href={href}
      className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl transition active:scale-[0.98] hover:border-amber-500/25 sm:gap-4 sm:p-4"
    >
      <div className="relative hidden h-11 w-11 shrink-0 sm:block">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500 sm:text-xs">
          <span className="mr-1">{emoji}</span>
          {label}
        </p>
        <p className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
          {value}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({
  emoji,
  title,
  desc,
  href,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition active:scale-[0.98] hover:border-amber-500/25 sm:p-5"
    >
      <p className="mb-2 text-2xl">{emoji}</p>
      <h3 className="font-medium text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    STOPPED: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
    CREATING: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    ERROR: "bg-red-500/15 text-red-400 ring-red-500/30",
  };
  const label: Record<string, string> = {
    RUNNING: "🟢 Active",
    STOPPED: "⏸️ Paused",
    CREATING: "⏳ Creating",
    ERROR: "🔴 Error",
  };
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {label[status] || status}
    </span>
  );
}
