"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  isAdminRole,
  isStaffRole,
  roleLabel,
  roleColor,
} from "@/lib/roles";

const workspaceLinks = [
  { href: "/dashboard", label: "Übersicht", icon: "home" },
  { href: "/dashboard/todos", label: "Todos", icon: "check" },
  { href: "/dashboard/team", label: "Mitglieder", icon: "users" },
  { href: "/dashboard/board", label: "Board", icon: "board" },
  { href: "/dashboard/account", label: "Konto", icon: "user" },
];

const extraLinks = [
  { href: "/dashboard/servers", label: "Server", icon: "server" },
  { href: "/dashboard/deposit", label: "Billing", icon: "wallet" },
  { href: "/dashboard/support", label: "Support", icon: "support" },
];

const adminTeamLinks = [
  { href: "/admin", label: "Admin", icon: "admin", exact: true },
  { href: "/admin/users", label: "Rollen", icon: "users" },
  { href: "/admin/support", label: "Support-Tickets", icon: "support" },
  { href: "/admin/activity", label: "Aktivitäten", icon: "activity" },
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
  if (type === "server")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    );
  if (type === "wallet")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
  if (type === "admin")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  if (type === "users")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  if (type === "activity")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  return null;
}

const LOGO_USER = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";
const LOGO_ADMIN = "https://cdn3.emoji.gg/emojis/18092-white.png";

export function DashboardNav({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    impersonatedBy?: string;
  };
}) {
  const pathname = usePathname();
  const [stopping, setStopping] = useState(false);
  const impersonating = Boolean(user.impersonatedBy);
  const role = user.role;
  const staff = isStaffRole(role) && !impersonating;
  const admin = isAdminRole(role) && !impersonating;
  const onAdmin = pathname.startsWith("/admin") && !impersonating;
  const logo = onAdmin ? LOGO_ADMIN : LOGO_USER;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function stopImpersonate() {
    setStopping(true);
    try {
      const res = await fetch("/api/admin/stop-impersonate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Fehler");
        return;
      }
      await signIn("credentials", {
        impersonateToken: data.token,
        redirect: true,
        callbackUrl: "/admin/users",
      });
    } finally {
      setStopping(false);
    }
  }

  function NavItem({ href, label, icon, exact }: { href: string; label: string; icon: string; exact?: boolean }) {
    const active = isActive(href, exact);
    return (
      <Link
        href={href}
        className={`nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
          active
            ? "active bg-amber-500/15 font-medium text-amber-400 ring-1 ring-amber-500/25"
            : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
        }`}
      >
        <Icon type={icon} />
        {label}
      </Link>
    );
  }

  return (
    <>
      {impersonating && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black lg:left-[240px]">
          <span>Du siehst das Panel als Nutzer {user.name || user.email}</span>
          <button
            type="button"
            disabled={stopping}
            onClick={stopImpersonate}
            className="rounded-lg bg-black/20 px-3 py-1 text-xs font-semibold hover:bg-black/30 disabled:opacity-50"
          >
            {stopping ? "…" : "Zurück zum Team"}
          </button>
        </div>
      )}

      <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
          <Image src={logo} alt="Stella" width={36} height={36} className="h-9 w-9 object-contain" unoptimized />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Stella <span className="text-amber-400">Dashboard</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Workspace
          </p>
          {workspaceLinks.map((l) => (
            <NavItem key={l.href} {...l} />
          ))}

          <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Mehr
          </p>
          {extraLinks.map((l) => (
            <NavItem key={l.href} {...l} />
          ))}

          {staff && (
            <>
              <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                Admin
              </p>
              {(admin ? adminTeamLinks : [{ href: "/admin/support", label: "Support-Tickets", icon: "support" }]).map(
                (l) => (
                  <NavItem key={l.href} {...l} exact={(l as any).exact} />
                )
              )}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            {staff ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-amber-500/30">
                <Image src={LOGO_ADMIN} alt="Team" width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/25">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name || "Mitglied"}
                {role && (
                  <span className="ml-1.5 text-[10px] font-semibold" style={{ color: roleColor(role) }}>
                    {roleLabel(role)}
                  </span>
                )}
              </p>
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

      <header
        className={`glass-strong sticky z-40 flex items-center justify-between px-4 py-3 lg:hidden ${
          impersonating ? "top-10" : "top-0"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src={logo} alt="Stella" width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
          <span className="font-semibold text-white">
            Stella <span className="text-amber-400">Dashboard</span>
          </span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-zinc-400">
          Abmelden
        </button>
      </header>

      <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex lg:hidden">
        {[
          { href: "/dashboard", label: "Home", icon: "home" },
          { href: "/dashboard/todos", label: "Todos", icon: "check" },
          { href: "/dashboard/team", label: "Team", icon: "users" },
          { href: "/dashboard/board", label: "Board", icon: "board" },
        ].map((l) => {
          const active = isActive(l.href, l.href === "/dashboard");
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
