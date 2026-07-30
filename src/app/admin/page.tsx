import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, packages, servers, transactions, userCount, serverCount] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
      prisma.package.findMany({ orderBy: { pricePerHour: "asc" } }),
      prisma.server.findMany({
        where: { status: { not: "DELETED" } },
        include: { user: true, package: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { user: true },
      }),
      prisma.user.count(),
      prisma.server.count({ where: { status: { not: "DELETED" } } }),
    ]);

  const running = servers.filter((s) => s.status === "RUNNING").length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800">
      {/* PlainAdmin-style top header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="https://i.postimg.cc/25RvgMy6/sh-logo.png"
              alt="Stella Host"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              unoptimized
            />
            <div>
              <p className="text-sm font-bold text-slate-800">Stella Host</p>
              <p className="text-[11px] text-slate-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              ADMIN
            </span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Overview</h1>
          <p className="text-sm text-slate-400">Systemverwaltung & Statistiken</p>
        </div>

        {/* PlainAdmin stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AdminStat title="Kunden" value={userCount} accent="#3a57e8" />
          <AdminStat title="Pakete" value={packages.length} accent="#08B1BA" />
          <AdminStat title="Server online" value={running} accent="#1aa053" />
          <AdminStat title="Server gesamt" value={serverCount} accent="#f16a1b" />
        </div>

        {/* Packages – PlainAdmin card */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Server-Pakete</h2>
            <span className="text-xs text-slate-400">{packages.length} Einträge</span>
          </div>
          {packages.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              Keine Pakete – Seed ausführen: <code className="text-blue-600">npm run db:seed</code>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">CPU / RAM / Disk</th>
                    <th className="px-3 py-3 font-medium hidden md:table-cell">Node</th>
                    <th className="px-3 py-3 font-medium text-right">Preis/h</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packages.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-medium text-slate-700">{p.name}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {p.cpu} vCPU · {p.ramMb} MB · {p.diskGb} GB
                      </td>
                      <td className="px-3 py-3 text-slate-400 hidden md:table-cell">{p.node}</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-700">
                        {formatCurrency(Number(p.pricePerHour))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Kunden</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {u.name || u.email}
                      {u.role === "ADMIN" && (
                        <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-700">
                    {formatCurrency(Number(u.balance))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Servers */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Server</h2>
            </div>
            {servers.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">Keine Server</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {servers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {s.name}{" "}
                        <span className="text-xs font-normal text-slate-400">({s.status})</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {s.user.email} · {s.package.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      VMID {s.proxmoxVmid ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Transactions */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Transaktionen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Beschreibung</th>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium hidden sm:table-cell">Datum</th>
                  <th className="px-3 py-3 font-medium text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      Keine Transaktionen
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 text-slate-600">
                        {t.description || t.type}
                      </td>
                      <td className="px-3 py-3 text-slate-400">{t.user.email}</td>
                      <td className="px-3 py-3 text-slate-400 hidden sm:table-cell">
                        {new Date(t.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {Number(t.amount) >= 0 ? "+" : ""}
                        {formatCurrency(Number(t.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminStat({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
