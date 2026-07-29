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
    <header className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg">
            Server<span className="text-emerald-400">Dash</span>
          </Link>
          <nav className="hidden sm:flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  pathname === l.href
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400 hidden sm:inline">
            {user.name || user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 transition"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
