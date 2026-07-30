import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function AdminPage() {
  const [userCount, packages, serverCount, running, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.package.findMany({ orderBy: { pricePerHour: "asc" } }),
    prisma.server.count({ where: { status: { not: "DELETED" } } }),
    prisma.server.count({ where: { status: "RUNNING" } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Admin Overview</h1>
          <p className="text-sm text-zinc-500">Systemverwaltung</p>
        </div>
        <Link
          href="/admin/users"
          className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20"
        >
          Nutzer verwalten →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card title="Kunden" value={userCount} />
        <Card title="Pakete" value={packages.length} />
        <Card title="Online" value={running} />
        <Card title="Server" value={serverCount} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Server-Pakete</h2>
        </div>
        {packages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">Keine Pakete – Seed ausführen</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-600">
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Specs</th>
                  <th className="px-3 py-3 font-medium text-right">Preis/h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-medium text-zinc-200">{p.name}</td>
                    <td className="px-3 py-3 text-zinc-500">
                      {p.cpu} vCPU · {p.ramMb} MB · {p.diskGb} GB
                    </td>
                    <td className="px-3 py-3 text-right text-amber-400">
                      {formatCurrency(Number(p.pricePerHour))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121214] overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Letzte Transaktionen</h2>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">Keine</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-zinc-300">{t.description || t.type}</p>
                  <p className="text-xs text-zinc-600">{t.user.email}</p>
                </div>
                <span className={Number(t.amount) >= 0 ? "text-amber-400" : "text-red-400"}>
                  {Number(t.amount) >= 0 ? "+" : ""}
                  {formatCurrency(Number(t.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121214] p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
