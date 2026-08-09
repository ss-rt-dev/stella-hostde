import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) redirect("/dashboard");

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          members: true,
          todos: true,
          announcements: true,
        },
      },
    },
  });

  const openByTeam = await prisma.todo.groupBy({
    by: ["teamId"],
    where: { status: { not: "DONE" } },
    _count: true,
  });
  const openMap = Object.fromEntries(openByTeam.map((x) => [x.teamId, x._count]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Alle Teams</h1>
        <p className="text-sm text-zinc-500">
          {teams.length} Workspaces · jeweils getrennt
        </p>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-12 text-center text-sm text-zinc-500">
          Noch keine Teams angelegt
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-600">
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-3 py-3 font-medium">Owner</th>
                  <th className="px-3 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium text-right">Mitglieder</th>
                  <th className="px-3 py-3 font-medium text-right">Todos offen</th>
                  <th className="px-3 py-3 font-medium text-right">Board</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-zinc-200">{t.name}</td>
                    <td className="px-3 py-3 text-zinc-400">
                      {t.owner.name || t.owner.email}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tracking-wider text-amber-400/90">
                      {t.inviteCode}
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">{t._count.members}</td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {openMap[t.id] || 0}
                      <span className="text-zinc-600"> / {t._count.todos}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-300">
                      {t._count.announcements}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/teams/${t.id}`}
                        className="text-xs font-medium text-amber-400 hover:underline"
                      >
                        Öffnen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
