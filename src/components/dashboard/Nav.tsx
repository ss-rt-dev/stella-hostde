"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const serviceLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/dashboard/servers", label: "Virtual Servers", icon: "server" },
];

const financeLinks = [
  { href: "/dashboard/deposit", label: "Billing", icon: "card" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const c = `h-[18px] w-[18px] ${className}`;
  switch (name) {
    case "grid":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "server":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case "card":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "admin":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
}

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

  function NavLink({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: string;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
          active
            ? "bg-[#1a1a22] text-white font-medium border-l-2 border-amber-400 pl-[10px]"
            : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        <Icon name={icon} className={active ? "text-amber-400" : ""} />
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[#0c0c10] border-r border-white/[0.06] lg:flex">
        <div className="flex h-[64px] items-center gap-2.5 px-4 border-b border-white/[0.06]">
          <Image
            src="https://i.postimg.cc/25RvgMy6/sh-logo.png"
            alt="Stella Host"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            unoptimized
          />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Stella Host
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
              Service
            </p>
            <div className="space-y-0.5">
              {serviceLinks.map((l) => (
                <NavLink key={l.href} {...l} />
              ))}
              {user.role === "ADMIN" && (
                <NavLink href="/admin" label="Admin" icon="admin" />
              )}
            </div>
          </div>
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
              Finance
            </p>
            <div className="space-y-0.5">
              {financeLinks.map((l) => (
                <NavLink key={l.href} {...l} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-400">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-zinc-200">
                {user.name || "Kunde"}
              </p>
              <p className="truncate text-[11px] text-zinc-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-white hover:bg-white/[0.04] transition"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile top */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0c0c10]/95 px-4 backdrop-blur-lg lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="https://i.postimg.cc/25RvgMy6/sh-logo.png"
            alt="Stella Host"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            unoptimized
          />
          <span className="text-sm font-semibold text-white">Stella Host</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-zinc-500"
        >
          Abmelden
        </button>
      </header>

      {/* Mobile bottom */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-white/[0.06] bg-[#0c0c10]/95 backdrop-blur-lg lg:hidden">
        {[...serviceLinks, ...financeLinks].map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "text-amber-400" : "text-zinc-500"
              }`}
            >
              <Icon name={l.icon} />
              {l.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
