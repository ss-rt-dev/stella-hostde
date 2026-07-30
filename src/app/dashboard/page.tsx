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

  function dueDate(d: Date) {
    const x = new Date(d);
    x.setFullYear(x.getFullYear() + 1);
    return x.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[13px] text-zinc-500">
          <span className="text-zinc-600">Dashboard</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300">Overview</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deposit"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121218] px-3 py-1.5 text-[13px] font-medium text-amber-400 hover:border-amber-500/30 transition"
          >
            {formatCurrency(Number(user.balance))}
            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-400 text-[10px] font-bold text-black">
              +
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#121218] px-2.5 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-semibold text-amber-400">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <span className="text-[13px] text-zinc-300">
              {user.name?.split(" ")[0] || "Account"}
            </span>
          </div>
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight text-white">
          Overview
        </h1>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-[13px] font-semibold text-black hover:bg-amber-300 transition"
        >
          Create New
          <span className="text-base leading-none">+</span>
        </Link>
      </div>

      {/* Resource cards – Arqion style */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {/* Resources */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/[0.06] bg-[#121218] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-zinc-300">Resources</span>
            <Link href="/dashboard/servers" className="text-[11px] text-zinc-600 hover:text-amber-400">
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Virtual</span>
              <span className="font-medium text-zinc-200">{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">CPU</span>
              <span className="font-medium text-zinc-200">{totalCpu}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Running</span>
              <span className="font-medium text-emerald-400">{running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">RAM</span>
              <span className="font-medium text-zinc-200">{totalRam}G</span>
            </div>
          </div>
        </div>

        <StatusCard
          label="Running"
          count={running}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          }
        />
        <StatusCard
          label="Paused"
          count={paused}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </span>
          }
        />
        <StatusCard
          label="Stopped"
          count={stopped}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </span>
          }
        />
      </div>

      {/* Active Services */}
      <section className="rounded-xl border border-white/[0.06] bg-[#121218] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
          <h2 className="text-[13px] font-medium text-zinc-200 flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            Active Services
          </h2>
        </div>

        {user.servers.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm text-zinc-500">No active services</p>
            <Link
              href="/dashboard/servers"
              className="mt-2 inline-block text-[13px] text-amber-400 hover:underline"
            >
              Create your first server →
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-white/[0.04] md:hidden">
              {user.servers.map((s, i) => {
                const cpu = fakeCpu(s.id);
                return (
                  <div key={s.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-medium text-zinc-200">
                          <span className="text-zinc-600 mr-1.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {s.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {s.package.name} · {s.ipAddress || "—"}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <CpuBar percent={cpu} />
                      <span className="text-[11px] text-zinc-500">{cpu}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-4 py-2.5 font-medium">No</th>
                    <th className="px-3 py-2.5 font-medium">Service Name</th>
                    <th className="px-3 py-2.5 font-medium">Location</th>
                    <th className="px-3 py-2.5 font-medium">IP</th>
                    <th className="px-3 py-2.5 font-medium">Due Date</th>
                    <th className="px-3 py-2.5 font-medium">CPU</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {user.servers.map((s, i) => {
                    const cpu = fakeCpu(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.015] transition">
                        <td className="px-4 py-3 text-zinc-600 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1a1a22] text-[11px] font-semibold text-amber-400 ring-1 ring-white/[0.06]">
                              {s.package.name[0]}
                            </span>
                            <div>
                              <p className="font-medium text-zinc-200">{s.name}</p>
                              <p className="text-[11px] text-zinc-600">
                                {s.package.name} · {s.package.cpu}vCPU
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="text-sm">🇩🇪</span> Germany
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-[12px] text-zinc-500">
                          {s.ipAddress || "—"}
                        </td>
                        <td className="px-3 py-3 text-zinc-500 text-[12px]">
                          {dueDate(s.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <CpuBar percent={cpu} />
                            <span className="text-[11px] text-zinc-500 tabular-nums">
                              {cpu}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatusCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href="/dashboard/servers"
      className="rounded-xl border border-white/[0.06] bg-[#121218] p-4 hover:border-white/[0.1] transition"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-zinc-300">{label}</span>
        <span className="text-[11px] text-zinc-600 opacity-0 group-hover:opacity-100">
          View Details
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-tight text-white">
            {count}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">Servers</p>
        </div>
        {icon}
      </div>
    </Link>
  );
}

function CpuBar({ percent }: { percent: number }) {
  const filled = Math.round(percent / 10);
  return (
    <div className="flex h-2 w-[56px] gap-px">
      {Array.from({ length: 10 }).map((_, j) => (
        <div
          key={j}
          className={`h-full flex-1 rounded-[1px] ${
            j < filled ? "bg-amber-400" : "bg-white/[0.08]"
          }`}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RUNNING: "bg-emerald-500/10 text-emerald-400",
    STOPPED: "bg-zinc-500/10 text-zinc-400",
    CREATING: "bg-sky-500/10 text-sky-400",
    ERROR: "bg-red-500/10 text-red-400",
  };
  const labels: Record<string, string> = {
    RUNNING: "Active",
    STOPPED: "Paused",
    CREATING: "Creating",
    ERROR: "Stopped",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
        styles[status] || "bg-zinc-500/10 text-zinc-400"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
