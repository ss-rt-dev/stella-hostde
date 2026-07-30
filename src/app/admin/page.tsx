import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, packages, servers, transactions, userCount, serverCount] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.package.findMany({ orderBy: { pricePerHour: "asc" } }),
      prisma.server.findMany({
        where: { status: { not: "DELETED" } },
        include: { user: true, package: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: true },
      }),
      prisma.user.count(),
      prisma.server.count({ where: { status: { not: "DELETED" } } }),
    ]);

  const running = servers.filter((s) => s.status === "RUNNING").length;

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f0f0ec]">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(212,175,55,0.08), transparent), radial-gradient(ellipse 50% 30% at 80% 100%, rgba(212,175,55,0.05), transparent)",
        }}
      />

      <header
        className="sticky top-0 z-40 border-b border-white/10"
        style={{
          background: "rgba(10,10,12,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/25">
              <span className="text-sm font-bold text-black">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                stella<span className="text-amber-400">host</span>{" "}
                <span className="ml-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/25">
                  ADMIN
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            👑 Admin-Bereich
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kunden, Pakete, Server und Transaktionen verwalten
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat emoji="👥" label="Kunden" value={userCount} />
          <Stat emoji="📦" label="Pakete" value={packages.length} />
          <Stat emoji="🟢" label="Online" value={running} />
          <Stat emoji="🖥️" label="Server" value={serverCount} />
        </div>

        {/* Packages */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-white">📦 Server-Pakete</h2>
            <span className="text-xs text-zinc-600">{packages.length} aktiv</span>
          </div>
          {packages.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">
              Keine Pakete – bitte Seed ausführen:
              <code className="mt-2 block text-amber-400">npm run db:seed</code>
            </p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-white/5 sm:hidden">
                {packages.map((p) => (
                  <div key={p.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-200">{p.name}</p>
                      <span className="text-sm font-semibold text-amber-400">
                        {formatCurrency(Number(p.pricePerHour))}/h
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {p.cpu} vCPU · {p.ramMb} MB · {p.diskGb} GB · {p.node}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-zinc-600">
                      {p.proxmoxTemplateId}
                    </p>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-3 py-3 font-medium">Specs</th>
                      <th className="px-3 py-3 font-medium">Template</th>
                      <th className="px-3 py-3 font-medium">Node</th>
                      <th className="px-3 py-3 font-medium">Preis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {packages.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium text-zinc-200">
                          {p.name}
                        </td>
                        <td className="px-3 py-3 text-zinc-400">
                          {p.cpu} vCPU · {p.ramMb} MB · {p.diskGb} GB
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-3 font-mono text-xs text-zinc-600">
                          {p.proxmoxTemplateId}
                        </td>
                        <td className="px-3 py-3 text-zinc-500">{p.node}</td>
                        <td className="px-3 py-3 font-medium text-amber-400">
                          {formatCurrency(Number(p.pricePerHour))}/h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Users */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-white">
              👥 Kunden (letzte {users.length})
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-200">
                    {u.name || u.email}
                    {u.role === "ADMIN" && (
                      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">
                        ADMIN
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{u.email}</p>
                </div>
                <p className="text-sm font-medium text-amber-400 sm:text-right">
                  {formatCurrency(Number(u.balance))}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Servers */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-white">
              🖥️ Server (letzte {servers.length})
            </h2>
          </div>
          {servers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">
              Noch keine Server provisioniert
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {servers.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-200">
                      {s.name}{" "}
                      <StatusBadge status={s.status} />
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {s.user.email} · {s.package.name}
                      {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    VMID {s.proxmoxVmid ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-white">
              💳 Transaktionen
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                Keine Transaktionen
              </p>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-300">
                      {t.description || t.type}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {t.user.email} ·{" "}
                      {new Date(t.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      Number(t.amount) >= 0
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {Number(t.amount) >= 0 ? "+" : ""}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <p className="text-lg">{emoji}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-500/15 text-emerald-400",
    STOPPED: "bg-zinc-500/15 text-zinc-400",
    CREATING: "bg-sky-500/15 text-sky-400",
    ERROR: "bg-red-500/15 text-red-400",
  };
  return (
    <span
      className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}
