"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const workspaceLinks = [
  { href: "/dashboard", label: "Übersicht", icon: "home" },
  { href: "/dashboard/todos", label: "Todos", icon: "check" },
  { href: "/dashboard/team", label: "Mitglieder", icon: "users" },
  { href: "/dashboard/board", label: "Board", icon: "board" },
  { href: "/dashboard/support", label: "Support", icon: "support" },
  { href: "/dashboard/account", label: "Konto", icon: "user" },
];

function Icon({ type }: { type: string }) {
  const cls = "nav-icon nav-icon-bounce h-5 w-5 shrink-0";
  if (type === "home")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    );
  if (type === "check")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  if (type === "board")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    );
  if (type === "user")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  if (type === "support")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  if (type === "users")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  return null;
}

const LOGO = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";

export function DashboardNav({
  user,
  activeTeam,
  teamCount = 0,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  activeTeam?: {
    id: string;
    name: string;
    role: string;
    inviteCode?: string;
  } | null;
  teamCount?: number;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
          <Image src={LOGO} alt="Stella" width={36} height={36} className="h-9 w-9 object-contain" unoptimized />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Stella <span className="text-amber-400">Dashboard</span>
          </span>
        </div>

        {activeTeam && (
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{activeTeam.name}</p>
            <p className="text-[11px] text-zinc-500">{activeTeam.role}</p>
            <Link
              href="/dashboard/teams"
              className="mt-1.5 inline-block text-[11px] text-amber-400 hover:underline"
            >
              Teams wechseln ({teamCount})
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Workspace
          </p>
          {workspaceLinks.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
                  active
                    ? "active bg-amber-500/15 font-medium text-amber-400 ring-1 ring-amber-500/25"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                }`}
              >
                <Icon type={l.icon} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/25">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{user.name || "Mitglied"}</p>
              <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Abmelden
          </button>
        </div>
      </aside>

      <header className="glass-strong sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src={LOGO} alt="Stella" width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
          <span className="font-semibold text-white">
            {activeTeam?.name || (
              <>
                Stella <span className="text-amber-400">Dashboard</span>
              </>
            )}
          </span>
        </Link>
        <Link href="/dashboard/teams" className="text-xs text-amber-400">
          Teams
        </Link>
      </header>

      <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex lg:hidden">
        {[
          { href: "/dashboard", label: "Home", icon: "home" },
          { href: "/dashboard/todos", label: "Todos", icon: "check" },
          { href: "/dashboard/team", label: "Team", icon: "users" },
          { href: "/dashboard/support", label: "Support", icon: "support" },
        ].map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "active text-amber-400" : "text-zinc-500"
              }`}
            >
              <Icon type={l.icon} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
