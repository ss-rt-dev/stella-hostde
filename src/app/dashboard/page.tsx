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
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Willkommen, {user.name || "Kunde"}</h1>
        <p className="text-zinc-400">Hier ist deine Übersicht</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Guthaben</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">
            {formatCurrency(Number(user.balance))}
          </p>
          <Link
            href="/dashboard/deposit"
            className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
          >
            Aufladen →
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Aktive Server</p>
          <p className="mt-1 text-3xl font-bold">
            {user.servers.filter((s) => s.status === "RUNNING").length}
          </p>
          <Link
            href="/dashboard/servers"
            className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
          >
            Verwalten →
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Gesamt Server</p>
          <p className="mt-1 text-3xl font-bold">{user.servers.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-semibold">Letzte Transaktionen</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {user.transactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-500">
              Noch keine Transaktionen
            </p>
          ) : (
            user.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm">{t.description || t.type}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(t.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={
                    Number(t.amount) >= 0
                      ? "text-emerald-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {Number(t.amount) >= 0 ? "+" : ""}
                  {formatCurrency(Number(t.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
