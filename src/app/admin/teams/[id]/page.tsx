import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) redirect("/dashboard");

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              lastLoginAt: true,
              role: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      todos: {
        orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        take: 50,
        include: {
          assignee: { select: { name: true, email: true } },
          createdBy: { select: { name: true, email: true } },
        },
      },
      announcements: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 10,
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!team) notFound();

  const openTodos = team.todos.filter((t) => t.status !== "DONE");
  const doneTodos = team.todos.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/teams" className="text-xs text-amber-400 hover:underline">
            ← Alle Teams
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">{team.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Owner: {team.owner.name || team.owner.email} · Code{" "}
            <span className="font-mono text-amber-400">{team.inviteCode}</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs text-zinc-500">
          <span className="rounded-lg border border-white/10 px-3 py-1.5">
            {team.members.length} Mitglieder
          </span>
          <span className="rounded-lg border border-white/10 px-3 py-1.5">
            {openTodos.length} offene Todos
          </span>
        </div>
      </div>

      {/* Mitglieder – eigener Block */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Mitglieder</h2>
          <p className="text-xs text-zinc-500">Nur dieses Team</p>
        </div>
        <ul className="divide-y divide-white/5">
          {team.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
            >
              <div>
                <p className="font-medium text-zinc-200">
                  {m.user.name || m.user.email}
                  <span className="ml-2 text-[11px] font-semibold text-amber-400">
                    {m.role}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">{m.user.email}</p>
              </div>
              <p className="text-xs text-zinc-600">
                Login:{" "}
                {m.user.lastLoginAt
                  ? new Date(m.user.lastLoginAt).toLocaleDateString("de-DE")
                  : "nie"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Todos – eigener Block */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Todos</h2>
          <p className="text-xs text-zinc-500">Nur Aufgaben dieses Teams</p>
        </div>
        {team.todos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Keine Todos</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {[...openTodos, ...doneTodos].map((t) => (
              <li key={t.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-200">{t.title}</p>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                    {t.scope}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.status === "DONE"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : t.status === "IN_PROGRESS"
                          ? "bg-sky-500/15 text-sky-400"
                          : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-[10px] text-zinc-500">{t.priority}</span>
                </div>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{t.description}</p>
                )}
                <p className="mt-1 text-[11px] text-zinc-600">
                  von {t.createdBy.name || t.createdBy.email}
                  {t.assignee
                    ? ` · → ${t.assignee.name || t.assignee.email}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Board – eigener Block */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Board</h2>
        </div>
        {team.announcements.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">Keine Ankündigungen</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {team.announcements.map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <p className="font-medium text-zinc-200">
                  {a.pinned && (
                    <span className="mr-2 text-[10px] text-amber-400">PIN</span>
                  )}
                  {a.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-zinc-500">{a.body}</p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {a.author.name || a.author.email} ·{" "}
                  {new Date(a.createdAt).toLocaleString("de-DE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
