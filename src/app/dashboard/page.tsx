import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { isStaffRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = session.user.id;
  const role = (session.user as any).role as string;
  const staff = isStaffRole(role);

  const [user, membersCount, openTeamTodos, myOpenTodos, announcements, recentTodos] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.count(),
      prisma.todo.count({ where: { scope: "TEAM", status: { not: "DONE" } } }),
      prisma.todo.count({
        where: {
          status: { not: "DONE" },
          OR: [{ assigneeId: userId }, { createdById: userId, scope: "PERSONAL" }],
        },
      }),
      prisma.teamAnnouncement.findMany({
        include: { author: { select: { name: true, email: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
      prisma.todo.findMany({
        where: {
          OR: [
            { scope: "TEAM" },
            { assigneeId: userId },
            { createdById: userId },
          ],
          status: { not: "DONE" },
        },
        include: {
          assignee: { select: { name: true, email: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
    ]);

  if (!user) return null;
  const displayName = user.name?.trim() || user.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            Stella Team Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Hallo, {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Überblick über Team, Aufgaben und Updates
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/todos"
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20"
          >
            + Todo
          </Link>
          {staff && (
            <Link
              href="/dashboard/team"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.07]"
            >
              Mitglieder
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Mitglieder" value={String(membersCount)} href="/dashboard/team" />
        <Stat label="Team-Todos offen" value={String(openTeamTodos)} href="/dashboard/todos?scope=TEAM" />
        <Stat label="Meine offen" value={String(myOpenTodos)} href="/dashboard/todos?scope=PERSONAL" />
        <Stat label="Ankündigungen" value={String(announcements.length)} href="/dashboard/board" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214] lg:col-span-3">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">Offene Aufgaben</h2>
            <Link href="/dashboard/todos" className="text-sm text-amber-400 hover:underline">
              Alle
            </Link>
          </div>
          {recentTodos.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">
              Keine offenen Todos – Zeit für neue Ziele.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTodos.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-200">{t.title}</p>
                    <p className="text-xs text-zinc-500">
                      {t.scope === "TEAM" ? "Team" : "Persönlich"}
                      {t.assignee
                        ? ` · ${t.assignee.name || t.assignee.email}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.status === "IN_PROGRESS"
                        ? "bg-sky-500/15 text-sky-400"
                        : t.priority === "HIGH"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {t.status === "IN_PROGRESS" ? "läuft" : t.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">Board</h2>
            <Link href="/dashboard/board" className="text-sm text-amber-400 hover:underline">
              Mehr
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">
              Noch keine Ankündigungen
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {announcements.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <span className="text-[10px] font-medium text-amber-400">PIN</span>
                    )}
                    <p className="font-medium text-zinc-200">{a.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/dashboard/todos" title="Todos" desc="Team & persönlich" />
        <QuickLink href="/dashboard/team" title="Mitglieder" desc="Rollen & Aufgaben" />
        <QuickLink href="/dashboard/board" title="Board" desc="Ankündigungen" />
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
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/35"
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/30 hover:bg-white/[0.03]"
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
    </Link>
  );
}
