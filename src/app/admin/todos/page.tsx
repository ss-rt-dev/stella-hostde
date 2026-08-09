import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminTodosPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) redirect("/dashboard");

  const sp = await searchParams;
  const teamFilter = sp.team || "";
  const statusFilter = sp.status || "";

  const where: any = {};
  if (teamFilter) where.teamId = teamFilter;
  if (statusFilter && ["OPEN", "IN_PROGRESS", "DONE"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [todos, teams] = await Promise.all([
    prisma.todo.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 150,
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Alle Todos</h1>
        <p className="text-sm text-zinc-500">Über alle Teams – filterbar</p>
      </div>

      <form className="flex flex-wrap gap-2">
        <select
          name="team"
          defaultValue={teamFilter}
          className="rounded-xl border border-white/10 bg-[#121214] px-3 py-2 text-sm text-white"
        >
          <option value="">Alle Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-xl border border-white/10 bg-[#121214] px-3 py-2 text-sm text-white"
        >
          <option value="">Alle Status</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
        >
          Filtern
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        {todos.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">Keine Todos</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {todos.map((t) => (
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
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Team:{" "}
                  <Link
                    href={`/admin/teams/${t.team.id}`}
                    className="text-amber-400 hover:underline"
                  >
                    {t.team.name}
                  </Link>
                  {" · von "}{t.createdBy.name || t.createdBy.email}
                  {t.assignee
                    ? ` · → ${t.assignee.name || t.assignee.email}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
