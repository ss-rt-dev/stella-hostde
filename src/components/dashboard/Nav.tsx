"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/dashboard/servers", label: "Server", icon: "▣" },
  { href: "/dashboard/deposit", label: "Billing", icon: "◎" },
];

export function DashboardNav({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/10 lg:flex"
        style={{
          background: "rgba(10,10,12,0.85)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/25">
            <span className="text-sm font-bold text-black">S</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            stella<span className="text-amber-400">host</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            Home
          </p>
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 font-medium text-amber-400 shadow-sm ring-1 ring-amber-500/25"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                }`}
              >
                <span className="text-sm">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500/15 font-medium text-amber-400 ring-1 ring-amber-500/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <span className="text-sm">★</span>
              Admin
            </Link>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/25">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name || "Kunde"}
              </p>
              <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 backdrop-blur transition hover:bg-white/5 hover:text-white"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden"
        style={{
          background: "rgba(10,10,12,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600">
            <span className="text-xs font-bold text-black">S</span>
          </div>
          <span className="font-semibold text-white">
            stella<span className="text-amber-400">host</span>
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"
        >
          Abmelden
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 lg:hidden"
        style={{
          background: "rgba(10,10,12,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        {links.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
                active ? "text-amber-400" : "text-zinc-500"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
