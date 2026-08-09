import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) redirect("/dashboard");

  const [
    userCount,
    teamCount,
    memberCount,
    openTodos,
    openTickets,
    recentTeams,
    recentTodos,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.teamMember.count(),
    prisma.todo.count({ where: { status: { not: "DONE" } } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        owner: { select: { email: true, name: true } },
        _count: { select: { members: true, todos: true } },
      },
    }),
    prisma.todo.findMany({
      where: { status: { not: "DONE" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        team: { select: { name: true, id: true } },
        assignee: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
          Platform Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">Übersicht</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Alle Teams, Nutzer und Aufgaben – plattformweit, getrennt vom Workspace
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Nutzer" value={userCount} href="/admin/users" />
        <Stat label="Teams" value={teamCount} href="/admin/teams" />
        <Stat label="Mitgliedschaften" value={memberCount} href="/admin/teams" />
        <Stat label="Offene Todos" value={openTodos} href="/admin/todos" />
        <Stat label="Offene Tickets" value={openTickets} href="/admin/support" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">Neueste Teams</h2>
            <Link href="/admin/teams" className="text-sm text-amber-400 hover:underline">
              Alle
            </Link>
          </div>
          {recentTeams.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">Noch keine Teams</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTeams.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/teams/${t.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-200">{t.name}</p>
                      <p className="text-xs text-zinc-500">
                        Owner: {t.owner.name || t.owner.email} · Code {t.inviteCode}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {t._count.members} Mitgl. · {t._count.todos} Todos
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">Offene Todos (global)</h2>
            <Link href="/admin/todos" className="text-sm text-amber-400 hover:underline">
              Alle
            </Link>
          </div>
          {recentTodos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">Keine offenen Todos</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTodos.map((t) => (
                <li key={t.id} className="px-5 py-3.5">
                  <p className="font-medium text-zinc-200">{t.title}</p>
                  <p className="text-xs text-zinc-500">
                    Team:{" "}
                    <Link href={`/admin/teams/${t.team.id}`} className="text-amber-400 hover:underline">
                      {t.team.name}
                    </Link>
                    {" · "}
                    {t.scope} · {t.status}
                    {t.assignee
                      ? ` · → ${t.assignee.name || t.assignee.email}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/35"
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </Link>
  );
}
