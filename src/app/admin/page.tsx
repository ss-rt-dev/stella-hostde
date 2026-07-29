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

  const [users, packages, servers, transactions] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.package.findMany({ orderBy: { pricePerHour: "asc" } }),
    prisma.server.findMany({
      where: { status: { not: "DELETED" } },
      include: { user: true, package: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: true },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="font-bold text-lg">
            Server<span className="text-emerald-400">Dash</span>{" "}
            <span className="text-amber-400 text-sm">Admin</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        <h1 className="text-2xl font-bold">Admin-Bereich</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Kunden" value={users.length} />
          <Stat label="Pakete" value={packages.length} />
          <Stat
            label="Aktive Server"
            value={servers.filter((s) => s.status === "RUNNING").length}
          />
          <Stat label="Transaktionen" value={transactions.length} />
        </div>

        {/* Packages */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="font-semibold">Pakete</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {packages.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-zinc-500">
                    {p.cpu} vCPU · {p.ramMb} MB · {p.diskGb} GB · Node: {p.node}
                  </p>
                </div>
                <span className="text-emerald-400">
                  {formatCurrency(Number(p.pricePerHour))}/h
                </span>
              </div>
            ))}
            {packages.length === 0 && (
              <p className="px-6 py-6 text-zinc-500 text-sm">
                Noch keine Pakete. Lege welche in der Datenbank an.
              </p>
            )}
          </div>
        </section>

        {/* Users */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="font-semibold">Kunden (letzte 20)</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="font-medium">{u.name || u.email}</p>
                  <p className="text-sm text-zinc-500">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400">
                    {formatCurrency(Number(u.balance))}
                  </p>
                  <p className="text-xs text-zinc-500">{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Servers */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="font-semibold">Server (letzte 20)</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="font-medium">
                    {s.name}{" "}
                    <span className="text-xs text-zinc-500">
                      ({s.status})
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500">
                    {s.user.email} · {s.package.name}
                  </p>
                </div>
                <span className="text-sm text-zinc-400">
                  VMID {s.proxmoxVmid}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
