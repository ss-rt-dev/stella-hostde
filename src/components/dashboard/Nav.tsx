"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const serviceLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "◆" },
  { href: "/dashboard/servers", label: "Virtual Servers", icon: "▣" },
];

const financeLinks = [
  { href: "/dashboard/deposit", label: "Billing", icon: "◈" },
];

const accountLinks = [
  { href: "#", label: "Settings", icon: "⚙", disabled: true },
  { href: "#", label: "Support", icon: "✉", disabled: true },
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

  function NavItem({
    href,
    label,
    icon,
    disabled,
  }: {
    href: string;
    label: string;
    icon: string;
    disabled?: boolean;
  }) {
    const active = isActive(href);
    if (disabled) {
      return (
        <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 cursor-not-allowed">
          <span className="w-5 text-center text-xs">{icon}</span>
          {label}
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active
            ? "bg-amber-500/15 text-amber-400 font-medium ring-1 ring-amber-500/30"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
        }`}
      >
        <span className="w-5 text-center text-xs">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Sidebar – desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/8 bg-[#0c0c0e] lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/20">
            <span className="text-sm font-bold text-black">S</span>
          </div>
          <span className="font-semibold tracking-tight text-white">
            stella<span className="text-amber-400">host</span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Service
            </p>
            <div className="space-y-0.5">
              {serviceLinks.map((l) => (
                <NavItem key={l.href} {...l} />
              ))}
              {user.role === "ADMIN" && (
                <NavItem href="/admin" label="Admin" icon="★" />
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Finance
            </p>
            <div className="space-y-0.5">
              {financeLinks.map((l) => (
                <NavItem key={l.href} {...l} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Account
            </p>
            <div className="space-y-0.5">
              {accountLinks.map((l) => (
                <NavItem key={l.href + l.label} {...l} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-400">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name || "Kunde"}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* Top bar – mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/8 bg-[#0c0c0e]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-yellow-600">
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
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-white/8 bg-[#0c0c0e]/95 backdrop-blur-xl lg:hidden">
        {[...serviceLinks, ...financeLinks].map((l) => {
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
              {l.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
