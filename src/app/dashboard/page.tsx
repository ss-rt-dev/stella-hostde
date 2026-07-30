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
        take: 6,
      },
    },
  });

  if (!user) return null;

  const running = user.servers.filter((s) => s.status === "RUNNING").length;
  const stopped = user.servers.filter((s) => s.status === "STOPPED").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Stella Host · Kundenbereich
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Willkommen zurück{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Verwalte Guthaben, Server und Zahlungen an einem Ort.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/deposit"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 transition"
          >
            Guthaben aufladen
          </Link>
          <Link
            href="/dashboard/servers"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 transition"
          >
            Server verwalten
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Guthaben"
          value={formatCurrency(Number(user.balance))}
          accent
          href="/dashboard/deposit"
          cta="Aufladen"
        />
        <StatCard
          label="Server online"
          value={String(running)}
          href="/dashboard/servers"
          cta="Anzeigen"
        />
        <StatCard
          label="Server gestoppt"
          value={String(stopped)}
          href="/dashboard/servers"
        />
        <StatCard
          label="Server gesamt"
          value={String(user.servers.length)}
          href="/dashboard/servers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Servers preview */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#111113]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-medium">Deine Server</h2>
            <Link
              href="/dashboard/servers"
              className="text-sm text-emerald-400 hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>
          {user.servers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-zinc-400">Noch keine Server vorhanden</p>
              <Link
                href="/dashboard/servers"
                className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
              >
                Ersten Server erstellen →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {user.servers.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.name}</span>
                      <StatusDot status={s.status} />
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {s.package.name}
                      {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                      {s.proxmoxVmid ? ` · VMID ${s.proxmoxVmid}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatCurrency(Number(s.package.pricePerHour))}/h
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#111113]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-medium">Letzte Transaktionen</h2>
          </div>
          {user.transactions.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">
              Noch keine Bewegungen
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {user.transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {t.description || t.type}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(t.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      Number(t.amount) >= 0
                        ? "text-emerald-400"
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
      </div>

      {/* Quick help */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111113] to-[#0a0a0b] p-6">
        <h2 className="font-medium">Schnellstart bei Stella Host</h2>
        <ol className="mt-3 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
          <li className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <span className="text-emerald-400 font-medium">1.</span> Guthaben
            per PayPal aufladen
          </li>
          <li className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <span className="text-emerald-400 font-medium">2.</span> LXC-Server
            aus einem Paket erstellen
          </li>
          <li className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <span className="text-emerald-400 font-medium">3.</span> Starten,
            stoppen und per IP verbinden
          </li>
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  href,
  cta,
}: {
  label: string;
  value: string;
  accent?: boolean;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111113] p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {href && cta && (
        <Link
          href={href}
          className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-400",
    STOPPED: "bg-zinc-500",
    CREATING: "bg-sky-400",
    ERROR: "bg-red-400",
  };
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        map[status] || "bg-zinc-500"
      }`}
      title={status}
    />
  );
}
