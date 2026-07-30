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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  const running = user.servers.filter((s) => s.status === "RUNNING").length;
  const paused = user.servers.filter((s) => s.status === "STOPPED").length;
  const stopped = user.servers.filter((s) => s.status === "ERROR").length;
  const creating = user.servers.filter((s) => s.status === "CREATING").length;
  const total = user.servers.length;
  const totalCpu = user.servers.reduce((a, s) => a + s.package.cpu, 0);
  const totalRam = Math.round(
    user.servers.reduce((a, s) => a + s.package.ramMb, 0) / 1024
  );

  function fakeCpu(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 100;
    return 30 + (h % 65);
  }

  function dueDate(createdAt: Date) {
    const d = new Date(createdAt);
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="text-zinc-600">⌂</span>
          <span>Dashboard</span>
          <span className="text-zinc-700">›</span>
          <span className="text-zinc-300">Overview</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deposit"
            className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400"
          >
            {formatCurrency(Number(user.balance))}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-black">
              +
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm text-zinc-300">
              {user.name?.split(" ")[0] || "Account"}
            </span>
          </div>
        </div>
      </div>

      {/* Title + Create New */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Overview
        </h1>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-yellow-400"
        >
          Create New
          <span className="text-base leading-none">+</span>
        </Link>
      </div>

      {/* Resource cards row – 1:1 Arqion style */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Resources card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0e0e12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Resources</span>
            <Link
              href="/dashboard/servers"
              className="text-[11px] text-zinc-500 hover:text-amber-400"
            >
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
            <Row label="Virtual" value={total} />
            <Row label="CPU" value={totalCpu} />
            <Row label="Running" value={running} accent="emerald" />
            <Row label="RAM GB" value={totalRam} />
            <Row label="Creating" value={creating} accent="sky" />
            <Row label="Paused" value={paused} accent="amber" />
          </div>
        </div>

        {/* Running */}
        <StatusCard
          label="Running"
          count={running}
          unit="Servers"
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              ▶
            </span>
          }
          href="/dashboard/servers"
        />

        {/* Paused */}
        <StatusCard
          label="Paused"
          count={paused}
          unit="Servers"
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              ❚❚
            </span>
          }
          href="/dashboard/servers"
        />

        {/* Stopped */}
        <StatusCard
          label="Stopped"
          count={stopped}
          unit="Servers"
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
              ■
            </span>
          }
          href="/dashboard/servers"
        />
      </div>

      {/* Active Services table */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e0e12]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-100">
            <span className="text-amber-400">◈</span>
            Active Services
          </h2>
        </div>

        {user.servers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-zinc-500">No active services yet</p>
            <Link
              href="/dashboard/servers"
              className="mt-3 inline-block text-sm text-amber-400 hover:underline"
            >
              Create your first server →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                  <th className="px-5 py-3">No</th>
                  <th className="px-3 py-3">Service Name</th>
                  <th className="px-3 py-3">Service Location</th>
                  <th className="px-3 py-3">IP</th>
                  <th className="px-3 py-3">Due Date</th>
                  <th className="px-3 py-3">CPU</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {user.servers.map((s, i) => {
                  const cpu = fakeCpu(s.id);
                  return (
                    <tr
                      key={s.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 tabular-nums text-zinc-500">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                            {s.package.name.slice(0, 1)}
                          </span>
                          <div>
                            <p className="font-medium text-zinc-200">{s.name}</p>
                            <p className="text-[11px] text-zinc-600">
                              {s.package.name} · {s.package.cpu}vCPU /{" "}
                              {s.package.ramMb >= 1024
                                ? `${s.package.ramMb / 1024}GB`
                                : `${s.package.ramMb}MB`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">🇩🇪</span>
                          <span className="text-zinc-400">Germany</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-zinc-400">
                        {s.ipAddress || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-zinc-500">
                        {dueDate(s.createdAt)}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-2 w-[72px] gap-px">
                            {Array.from({ length: 10 }).map((_, j) => (
                              <div
                                key={j}
                                className={`h-full flex-1 rounded-[1px] ${
                                  j < Math.round(cpu / 10)
                                    ? "bg-amber-400"
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] tabular-nums text-zinc-500">
                            {cpu}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom product cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <PlanCard
          title="Cloud Server"
          desc="Scalable virtual machines in different locations."
          price={formatCurrency(0.05)}
          href="/dashboard/servers"
        />
        <PlanCard
          title="Dedicated Server"
          desc="Superior performance, control and security for hosting."
          price={formatCurrency(0.25)}
          href="/dashboard/servers"
        />
        <PlanCard
          title="Storage Server"
          desc="Secure, scalable storage for large data management."
          price={formatCurrency(0.12)}
          href="/dashboard/servers"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "sky";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "sky"
          ? "text-sky-400"
          : "text-zinc-200";
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function StatusCard({
  label,
  count,
  unit,
  icon,
  href,
}: {
  label: string;
  count: number;
  unit: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-[#0e0e12] p-4 transition hover:border-white/15"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-[11px] text-zinc-600 opacity-0 transition group-hover:opacity-100">
          View Details
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-white">
            {count}
          </p>
          <p className="text-xs text-zinc-600">{unit}</p>
        </div>
        {icon}
      </div>
    </Link>
  );
}

function PlanCard({
  title,
  desc,
  price,
  href,
}: {
  title: string;
  desc: string;
  price: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-[#0e0e12] p-5 transition hover:border-amber-500/30"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
        ▣
      </div>
      <h3 className="font-medium text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
      <p className="mt-3 text-sm font-semibold text-amber-400">
        {price}
        <span className="text-xs font-normal text-zinc-600">/h</span>
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    STOPPED: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
    CREATING: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    ERROR: "bg-red-500/15 text-red-400 ring-red-500/30",
  };
  const label: Record<string, string> = {
    RUNNING: "Active",
    STOPPED: "Paused",
    CREATING: "Creating",
    ERROR: "Stopped",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        map[status] || "bg-zinc-500/15 text-zinc-400"
      }`}
    >
      {label[status] || status}
    </span>
  );
}
