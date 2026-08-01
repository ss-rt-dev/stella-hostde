import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Moderator / Supporter → direkt zum Support
  if (!isAdminRole(role)) {
    redirect("/admin/support");
  }

  const [users, servers, openTickets, txCount] = await Promise.all([
    prisma.user.count(),
    prisma.server.count({ where: { status: { not: "DELETED" } } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.transaction.count(),
  ]);

  const cards = [
    { label: "Nutzer", value: users, href: "/admin/users" },
    { label: "Server", value: servers, href: "/admin/servers" },
    { label: "Offene Tickets", value: openTickets, href: "/admin/support" },
    { label: "Transaktionen", value: txCount, href: "/admin/transactions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Team Overview</h1>
        <p className="text-sm text-zinc-500">Kurzübersicht</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-white/10 bg-[#121214] p-5 transition hover:border-amber-500/30"
          >
            <p className="text-xs text-zinc-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
