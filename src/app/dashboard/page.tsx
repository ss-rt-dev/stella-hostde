import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { resolveActiveTeamId, getMembership, isTeamStaff } from "@/lib/teams";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) redirect("/dashboard/teams");

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) redirect("/dashboard/onboarding");

  const userId = session.user.id;
  const staff = isTeamStaff(membership.role);

  const [
    user,
    memberCount,
    openTeamTodos,
    myOpenTodos,
    announcements,
    recentTodos,
    platformAnnouncements,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.teamMember.count({ where: { teamId } }),
    prisma.todo.count({
      where: { teamId, scope: "TEAM", status: { not: "DONE" } },
    }),
    prisma.todo.count({
      where: {
        teamId,
        status: { not: "DONE" },
        OR: [
          { assigneeId: userId },
          { createdById: userId, scope: "PERSONAL" },
        ],
      },
    }),
    prisma.teamAnnouncement.findMany({
      where: { teamId },
      include: { author: { select: { name: true, email: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.todo.findMany({
      where: {
        teamId,
        status: { not: "DONE" },
        OR: [
          { scope: "TEAM" },
          { assigneeId: userId },
          { createdById: userId },
        ],
      },
      include: { assignee: { select: { name: true, email: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.platformAnnouncement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) return null;
  const displayName = user.name?.trim() || user.email;
  const teamTitle = membership.title;

  return (
    <div className="space-y-6">
      {/* Platform-Ankündigungen ganz oben */}
      {platformAnnouncements.length > 0 && (
        <div className="space-y-2">
          {platformAnnouncements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-5 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                Ankündigung
              </p>
              <p className="mt-1 font-semibold text-white">{a.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            {membership.team.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Hallo, {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Dashboard: Mitglied
            {teamTitle ? (
              <>
                {" · Team: "}
                <span className="text-amber-400">{teamTitle}</span>
              </>
            ) : null}
            {" · "}
            {membership.role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/todos"
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
          >
            + Aufgabe
          </Link>
          <Link
            href="/dashboard/chat"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Mitglieder" value={String(memberCount)} href="/dashboard/team" />
        <Stat label="Team-Aufgaben" value={String(openTeamTodos)} href="/dashboard/todos" />
        <Stat label="Meine offen" value={String(myOpenTodos)} href="/dashboard/todos" />
        <Stat label="Board" value={String(announcements.length)} href="/dashboard/board" />
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
              Keine offenen Aufgaben
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentTodos.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-200">{t.title}</p>
                    <p className="text-xs text-zinc-500">
                      {t.scope === "TEAM" ? "Team" : "Persönlich"}
                      {t.assignee
                        ? ` · ${t.assignee.name || t.assignee.email}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-semibold text-white">Team-Board</h2>
            <Link href="/dashboard/board" className="text-sm text-amber-400 hover:underline">
              Mehr
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">
              Keine Team-Ankündigungen
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {announcements.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <p className="font-medium text-zinc-200">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/dashboard/todos" title="Aufgaben" desc="Team & persönlich" />
        <QuickLink href="/dashboard/chat" title="Chat" desc="Team-Kanäle" />
        <QuickLink href="/dashboard/team" title="Mitglieder" desc="Rollen im Team" />
      </div>

      {staff && membership.team.inviteCode && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-xs text-zinc-500">Einladungscode für dieses Team</p>
          <p className="mt-1 font-mono text-lg tracking-wider text-amber-400">
            {membership.team.inviteCode}
          </p>
        </div>
      )}
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
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/30"
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
    </Link>
  );
}
