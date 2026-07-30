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
  const paused = user.servers.filter((s) => s.status === "STOPPED").length;
  const total = user.servers.length;
  const firstName = user.name?.split(" ")[0] || "Dev";

  return (
    <div className="space-y-6">
      {/* Hope UI style top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-slate-400">Willkommen zurück, {firstName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deposit"
            className="rounded-xl bg-[#3a57e8] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#2f4ad0] transition"
          >
            + Guthaben
          </Link>
          <Link
            href="/dashboard/servers"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Server
          </Link>
        </div>
      </div>

      {/* Welcome banner – Hope UI */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3a57e8] to-[#6c8cff] p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <h2 className="text-2xl font-bold sm:text-3xl">Hello {firstName}!</h2>
          <p className="mt-2 max-w-md text-sm text-blue-100">
            Verwalte deine Server und Zahlungen – Stella Host hält alles bereit.
          </p>
          <Link
            href="/dashboard/servers"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25 transition"
          >
            Server erstellen →
          </Link>
        </div>
      </div>

      {/* Stat cards with progress rings – Hope UI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Guthaben"
          value={formatCurrency(Number(user.balance))}
          percent={Math.min(100, Math.round(Number(user.balance) / 5))}
          color="#3a57e8"
          href="/dashboard/deposit"
        />
        <StatCard
          label="Server gesamt"
          value={String(total)}
          percent={total ? 100 : 0}
          color="#08B1BA"
          href="/dashboard/servers"
        />
        <StatCard
          label="Online"
          value={String(running)}
          percent={total ? Math.round((running / total) * 100) : 0}
          color="#1aa053"
          href="/dashboard/servers"
        />
        <StatCard
          label="Gestoppt"
          value={String(paused)}
          percent={total ? Math.round((paused / total) * 100) : 0}
          color="#f16a1b"
          href="/dashboard/servers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Active Services</h3>
            <Link
              href="/dashboard/servers"
              className="text-sm font-medium text-[#3a57e8] hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>

          {user.servers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">Noch keine Server</p>
              <Link
                href="/dashboard/servers"
                className="mt-2 inline-block text-sm text-[#3a57e8] hover:underline"
              >
                Ersten Server erstellen →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Paket</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Preis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {user.servers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3">
                        <p className="font-medium text-slate-700">{s.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          {s.ipAddress || "—"}
                        </p>
                      </td>
                      <td className="py-3 text-slate-500 hidden sm:table-cell">
                        {s.package.name}
                      </td>
                      <td className="py-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700">
                        {formatCurrency(Number(s.package.pricePerHour))}
                        <span className="text-xs text-slate-400">/h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Balance card + transactions */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 text-white shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Premium Account
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {formatCurrency(Number(user.balance))}
            </p>
            <p className="mt-1 text-xs text-slate-400">Verfügbares Guthaben</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                Stella Host
              </span>
              <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                **** {user.id.slice(-4)}
              </span>
            </div>
            <Link
              href="/dashboard/deposit"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#3a57e8] py-2.5 text-sm font-semibold hover:bg-[#2f4ad0] transition"
            >
              Aufladen
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Letzte Transaktionen
            </h3>
            {user.transactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Keine Bewegungen</p>
            ) : (
              <div className="space-y-2.5">
                {user.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-600">
                        {t.description || t.type}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-500"
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
    </div>
  );
}

function StatCard({
  label,
  value,
  percent,
  color,
  href,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  href: string;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:gap-4"
    >
      <div className="relative h-12 w-12 shrink-0">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="#eef0f6" strokeWidth="3.5" />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold text-slate-800">{value}</p>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-50 text-emerald-600",
    STOPPED: "bg-slate-100 text-slate-500",
    CREATING: "bg-sky-50 text-sky-600",
    ERROR: "bg-red-50 text-red-600",
  };
  const labels: Record<string, string> = {
    RUNNING: "Active",
    STOPPED: "Paused",
    CREATING: "Creating",
    ERROR: "Error",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] || "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
