import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) redirect("/dashboard");

  const t = await getServerT();

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
          {t("platform_admin")}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">{t("overview")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("teams_users_tickets")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t("users")} value={userCount} href="/admin/users" />
        <Stat label={t("teams")} value={teamCount} href="/admin/teams" />
        <Stat label={t("members")} value={memberCount} href="/admin/teams" />
        <Stat label={t("open_tasks")} value={openTodos} href="/admin/todos" />
        <Stat label={t("admin_tickets")} value={openTickets} href="/admin/support" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">{t("teams")}</h2>
            <Link href="/admin/teams" className="text-sm text-amber-400 hover:underline">
              {t("view_all")}
            </Link>
          </div>
          {recentTeams.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">{t("no_teams_yet")}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTeams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">{team.name}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {team.owner?.name || team.owner?.email} · {team._count.members}{" "}
                        {t("members")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">{t("open_tasks")}</h2>
            <Link href="/admin/todos" className="text-sm text-amber-400 hover:underline">
              {t("view_all")}
            </Link>
          </div>
          {recentTodos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">{t("no_open_tasks")}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTodos.map((todo) => (
                <li key={todo.id} className="px-5 py-3">
                  <p className="truncate text-sm font-medium text-zinc-100">{todo.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    {todo.team?.name} · {todo.priority}
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
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/30"
    >
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </Link>
  );
}
