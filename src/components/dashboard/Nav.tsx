"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function DashboardNav({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Übersicht" },
    { href: "/dashboard/servers", label: "Server" },
    { href: "/dashboard/deposit", label: "Guthaben" },
  ];

  if (user.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <span className="text-sm font-bold text-emerald-400">S</span>
            </div>
            <span className="font-semibold tracking-tight text-white">
              Stella <span className="text-emerald-400">Host</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {links.map((l) => {
              const active =
                l.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-white text-black font-medium"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm text-zinc-200">
              {user.name || "Kunde"}
            </span>
            <span className="text-xs text-zinc-500">{user.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            Abmelden
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex sm:hidden gap-1 overflow-x-auto border-t border-white/5 px-4 py-2">
        {links.map((l) => {
          const active =
            l.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                active
                  ? "bg-white text-black font-medium"
                  : "text-zinc-400"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
