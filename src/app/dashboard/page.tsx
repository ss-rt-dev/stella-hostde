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
  const stopped = user.servers.filter((s) => s.status === "STOPPED").length;
  const creating = user.servers.filter((s) => s.status === "CREATING").length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-600">Dashboard</span>
            <span className="mx-1.5 text-zinc-700">›</span>
            <span className="text-amber-400/80">Overview</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Willkommen zurück{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-sm font-medium text-amber-400">
            {formatCurrency(Number(user.balance))}
          </div>
          <Link
            href="/dashboard/deposit"
            className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-yellow-400"
          >
            + Aufladen
          </Link>
        </div>
      </div>

      {/* Promo banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-[#12120a] via-[#1a1608] to-[#0f0f12] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.12),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/70">
              Big Sale
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              BLACK <span className="text-amber-400">FRIDAY</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              Bis zu 40% Rabatt auf alle Server-Pakete – nimm dein Hosting aufs
              nächste Level.
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-amber-400">40%</p>
            <p className="text-xs uppercase tracking-wider text-zinc-500">OFF</p>
          </div>
        </div>
      </div>

      {/* Resource cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResourceCard
          label="Guthaben"
          value={formatCurrency(Number(user.balance))}
          sub="verfügbar"
          gold
          href="/dashboard/deposit"
        />
        <ResourceCard
          label="Running"
          value={String(running)}
          sub="Server online"
          accent="emerald"
          href="/dashboard/servers"
        />
        <ResourceCard
          label="Paused"
          value={String(stopped)}
          sub="gestoppt"
          accent="amber"
          href="/dashboard/servers"
        />
        <ResourceCard
          label="Creating"
          value={String(creating)}
          sub="in Erstellung"
          accent="sky"
          href="/dashboard/servers"
        />
      </div>

      {/* Active Services table */}
      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-medium text-zinc-100">Active Services</h2>
          <Link
            href="/dashboard/servers"
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-400"
          >
            Create New +
          </Link>
        </div>

        {user.servers.length === 0 ? (
          <div className="px-5 py-16 text-center">
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
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-zinc-600">
                  <th className="px-5 py-3 font-medium">No</th>
                  <th className="px-3 py-3 font-medium">Service Name</th>
                  <th className="px-3 py-3 font-medium">Package</th>
                  <th className="px-3 py-3 font-medium">IP</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {user.servers.map((s, i) => (
                  <tr
                    key={s.id}
                    className="transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5 text-zinc-500">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="font-medium text-zinc-200">{s.name}</span>
                    </td>
                    <td className="px-3 py-3.5 text-zinc-400">
                      {s.package.name}
                      <span className="ml-1.5 text-xs text-zinc-600">
                        {s.package.cpu}vCPU · {s.package.ramMb}MB
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-zinc-500">
                      {s.ipAddress || "—"}
                    </td>
                    <td className="px-3 py-3.5 text-zinc-300">
                      {formatCurrency(Number(s.package.pricePerHour))}
                      <span className="text-xs text-zinc-600">/h</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom row: transactions + product cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <section className="lg:col-span-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10]">
          <div className="border-b border-white/8 px-4 py-3">
            <h2 className="text-sm font-medium">Letzte Transaktionen</h2>
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
        </section>

        <ProductCard
          title="Cloud Server"
          desc="Skalierbare virtuelle Maschinen an verschiedenen Standorten."
          href="/dashboard/servers"
        />
        <ProductCard
          title="Dedicated Server"
          desc="Maximale Performance, volle Kontrolle und Sicherheit."
          href="/dashboard/servers"
        />
        <ProductCard
          title="Storage Server"
          desc="Sicherer, skalierbarer Speicher für große Datenmengen."
          href="/dashboard/servers"
        />
      </div>
    </div>
  );
}

function ResourceCard({
  label,
  value,
  sub,
  gold,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  gold?: boolean;
  accent?: "emerald" | "amber" | "sky";
  href?: string;
}) {
  const accentColor =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "sky"
        ? "text-sky-400"
        : accent === "amber"
          ? "text-amber-400"
          : gold
            ? "text-amber-400"
            : "text-white";

  const content = (
    <div className="rounded-2xl border border-white/8 bg-[#0e0e10] p-4 transition hover:border-amber-500/20">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${accentColor}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ProductCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/8 bg-[#0e0e10] p-5 transition hover:border-amber-500/30 hover:bg-[#121214]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 transition group-hover:bg-amber-500/20">
        <span className="text-lg">▣</span>
      </div>
      <h3 className="font-medium text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
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
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {status === "RUNNING"
        ? "Active"
        : status === "STOPPED"
          ? "Paused"
          : status}
    </span>
  );
}
