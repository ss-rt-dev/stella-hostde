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
      transactions: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!user) return null;

  const running = user.servers.filter((s) => s.status === "RUNNING").length;
  const paused = user.servers.filter((s) => s.status === "STOPPED").length;
  const total = user.servers.length;
  const displayName = user.name?.trim() || user.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-zinc-500">Willkommen zurück, {displayName}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/deposit"
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-yellow-400 transition"
          >
            + Guthaben
          </Link>
          <Link
            href="/dashboard/servers"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 transition"
          >
            Server
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-[#121214] to-[#0c0c0e] p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10" />
        <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
          Hallo {displayName}!
        </h2>
        <p className="relative mt-2 max-w-md text-sm text-zinc-400">
          Verwalte Server und Zahlungen – Stella Host.
        </p>
        <Link
          href="/dashboard/servers"
          className="relative mt-4 inline-flex rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-400/20 transition"
        >
          Server erstellen →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Guthaben" value={formatCurrency(Number(user.balance))} href="/dashboard/deposit" />
        <Stat label="Server" value={String(total)} href="/dashboard/servers" />
        <Stat label="Online" value={String(running)} href="/dashboard/servers" />
        <Stat label="Gestoppt" value={String(paused)} href="/dashboard/servers" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-semibold text-white">Active Services</h3>
            <Link href="/dashboard/servers" className="text-sm text-amber-400 hover:underline">
              Alle
            </Link>
          </div>
          {user.servers.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">Noch keine Server</p>
          ) : (
            <div className="divide-y divide-white/5">
              {user.servers.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-medium text-zinc-200">{s.name}</p>
                    <p className="text-xs text-zinc-500">
                      {s.package.name} · {s.ipAddress || "—"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "RUNNING"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-[#121214] p-5">
            <p className="text-xs uppercase tracking-wider text-amber-400/70">Guthaben</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {formatCurrency(Number(user.balance))}
            </p>
            <Link
              href="/dashboard/deposit"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-2.5 text-sm font-semibold text-black"
            >
              Aufladen
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Transaktionen</h3>
            {user.transactions.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-600">Keine</p>
            ) : (
              <div className="space-y-2">
                {user.transactions.map((t) => (
                  <div key={t.id} className="flex justify-between gap-2 text-xs">
                    <span className="truncate text-zinc-400">{t.description || t.type}</span>
                    <span className={Number(t.amount) >= 0 ? "text-amber-400" : "text-red-400"}>
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

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/30"
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </Link>
  );
}
