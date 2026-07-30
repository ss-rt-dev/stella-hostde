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
        take: 4,
      },
    },
  });

  if (!user) return null;

  const running = user.servers.filter((s) => s.status === "RUNNING").length;
  const stopped = user.servers.filter((s) => s.status === "STOPPED").length;
  const creating = user.servers.filter((s) => s.status === "CREATING").length;
  const total = user.servers.length;

  // Simulated CPU for visual bars (deterministic from id)
  function fakeCpu(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 100;
    return 25 + (h % 70);
  }

  return (
    <div className="space-y-5">
      {/* Top bar: breadcrumb + balance + user */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-zinc-600">⌂</span> Dashboard
          </span>
          <span className="mx-2 text-zinc-700">›</span>
          <span className="text-zinc-300">Overview</span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deposit"
            className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20"
          >
            {formatCurrency(Number(user.balance))}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">
              +
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm text-zinc-300">
              {user.name?.split(" ")[0] || "Account"}
            </span>
          </div>
        </div>
      </div>

      {/* Banner row: Black Friday + Refer */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Black Friday banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0e]">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 70% 40%, rgba(212,175,55,0.18) 0%, transparent 55%), linear-gradient(135deg, #0a0a0c 0%, #12100a 40%, #0c0c0e 100%)",
            }}
          />
          {/* grid lines */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to top, black, transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <div className="inline-flex items-center rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur">
                <span className="text-lg font-bold tracking-wide text-white sm:text-xl">
                  BLACK FRIDAY
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-zinc-400">
                Bis zu 40% Rabatt – bring dein Hosting aufs nächste Level.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-500/70">
                Big Sale
              </p>
              <p className="mt-1 text-5xl font-bold leading-none text-white sm:text-6xl">
                <span className="text-amber-400">40%</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                OFF
              </p>
            </div>
          </div>
        </div>

        {/* Refer card */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#1a1608] to-[#0c0c0e] p-5">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              ✦
            </div>
            <h3 className="font-semibold text-white">Refer and Earn</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Empfehle Stella Host und erhalte 15% Provision auf erfolgreiche
              Verkäufe.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/15 transition hover:from-amber-300 hover:to-yellow-400"
            >
              Refer Now →
            </button>
          </div>
        </div>
      </div>

      {/* Resource overview – like Arqion */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Resources summary */}
        <div className="rounded-2xl border border-white/8 bg-[#0e0e10] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Resources</p>
            <Link
              href="/dashboard/servers"
              className="text-[11px] text-amber-400/80 hover:text-amber-400"
            >
              View Details
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Virtual</span>
              <span className="font-medium text-zinc-200">{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">CPU</span>
              <span className="font-medium text-zinc-200">
                {user.servers.reduce((a, s) => a + s.package.cpu, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Running</span>
              <span className="font-medium text-emerald-400">{running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">RAM GB</span>
              <span className="font-medium text-zinc-200">
                {(
                  user.servers.reduce((a, s) => a + s.package.ramMb, 0) / 1024
                ).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <StatPill
          label="Running"
          value={running}
          unit="Servers"
          icon="▶"
          color="emerald"
          href="/dashboard/servers"
        />
        <StatPill
          label="Paused"
          value={stopped}
          unit="Servers"
          icon="❚❚"
          color="amber"
          href="/dashboard/servers"
        />
        <StatPill
          label="Creating"
          value={creating}
          unit="Servers"
          icon="●"
          color="sky"
          href="/dashboard/servers"
        />
      </div>

      {/* Active Services */}
      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-100">
            <span className="text-amber-400">◈</span> Active Services
          </h2>
          <Link
            href="/dashboard/servers"
            className="rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-3.5 py-1.5 text-xs font-semibold text-black shadow-md shadow-amber-500/15 transition hover:from-amber-300 hover:to-yellow-400"
          >
            Create New +
          </Link>
        </div>

        {user.servers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-zinc-500">Noch keine Server vorhanden</p>
            <Link
              href="/dashboard/servers"
              className="mt-3 inline-block text-sm text-amber-400 hover:underline"
            >
              Ersten Server erstellen →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-600">
                  <th className="px-5 py-3 font-medium">No</th>
                  <th className="px-3 py-3 font-medium">Service Name</th>
                  <th className="px-3 py-3 font-medium">Package</th>
                  <th className="px-3 py-3 font-medium">IP</th>
                  <th className="px-3 py-3 font-medium">CPU</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {user.servers.map((s, i) => {
                  const cpu = fakeCpu(s.id);
                  return (
                    <tr
                      key={s.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3.5 tabular-nums text-zinc-500">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-[10px] text-amber-400 ring-1 ring-amber-500/20">
                            {s.package.name[0]}
                          </span>
                          <span className="font-medium text-zinc-200">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-zinc-400">
                        {s.package.name}
                        <span className="ml-1.5 text-[11px] text-zinc-600">
                          {s.package.cpu}vCPU ·{" "}
                          {s.package.ramMb >= 1024
                            ? `${s.package.ramMb / 1024}GB`
                            : `${s.package.ramMb}MB`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-zinc-500">
                        {s.ipAddress || "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                              style={{ width: `${cpu}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums text-zinc-500">
                            {cpu}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-zinc-300">
                        {formatCurrency(Number(s.package.pricePerHour))}
                        <span className="text-[11px] text-zinc-600">/h</span>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-zinc-500">
                        {new Date(s.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
        )}
      </section>

      {/* Bottom: Support + Product cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Support / Transactions */}
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <h2 className="text-sm font-medium">Support Tickets</h2>
            <span className="text-[11px] text-zinc-600">View All</span>
          </div>
          <div className="divide-y divide-white/5">
            {user.transactions.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-600">
                Keine offenen Tickets
              </p>
            ) : (
              user.transactions.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
                  <p className="truncate text-xs text-zinc-300">
                    {t.description || t.type}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      Number(t.amount) >= 0
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                    }`}
                  >
                    {Number(t.amount) >= 0 ? "Open" : "Closed"}
                  </span>
                </div>
              ))
            )}
            {user.transactions.length === 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-zinc-500">Server downtime issue</p>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  Open
                </span>
              </div>
            )}
          </div>
        </section>

        <ProductCard
          title="Cloud Server"
          desc="Skalierbare virtuelle Maschinen an verschiedenen Standorten."
          icon="☁"
          href="/dashboard/servers"
        />
        <ProductCard
          title="Dedicated Server"
          desc="Maximale Performance, volle Kontrolle und Sicherheit."
          icon="▣"
          href="/dashboard/servers"
        />
        <ProductCard
          title="Storage Server"
          desc="Sicherer, skalierbarer Speicher für große Datenmengen."
          icon="⬡"
          href="/dashboard/servers"
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  unit,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: "emerald" | "amber" | "sky";
  href: string;
}) {
  const styles = {
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/25",
      bar: "from-emerald-500/20",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/25",
      bar: "from-amber-500/20",
    },
    sky: {
      text: "text-sky-400",
      bg: "bg-sky-500/10",
      ring: "ring-sky-500/25",
      bar: "from-sky-500/20",
    },
  }[color];

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10] p-4 transition hover:border-white/15"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${styles.bar} to-transparent opacity-0 transition group-hover:opacity-100`}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <span className="text-[11px] text-zinc-600 opacity-0 transition group-hover:opacity-100">
          View Details
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className={`text-3xl font-semibold tracking-tight ${styles.text}`}>
            {value}
          </p>
          <p className="text-xs text-zinc-600">{unit}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.bg} text-sm ${styles.text} ring-1 ${styles.ring}`}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function ProductCard({
  title,
  desc,
  icon,
  href,
}: {
  title: string;
  desc: string;
  icon: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/8 bg-[#0e0e10] p-5 transition hover:border-amber-500/25 hover:bg-[#121214]"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-600/5 text-lg text-amber-400 ring-1 ring-amber-500/20 transition group-hover:from-amber-500/25">
        {icon}
      </div>
      <h3 className="font-medium text-zinc-100">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
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
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {label[status] || status}
    </span>
  );
}
