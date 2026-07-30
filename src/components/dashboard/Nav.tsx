"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const serviceLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/dashboard/servers", label: "Virtual Servers", icon: "▣" },
  { href: "#", label: "Dedicated Servers", icon: "▤", disabled: true },
  { href: "#", label: "GPU Servers", icon: "◈", disabled: true },
  { href: "#", label: "Orchestration", icon: "⬡", disabled: true },
  { href: "#", label: "Databases", icon: "☰", disabled: true },
];

const financeLinks = [
  { href: "/dashboard/deposit", label: "Billing", icon: "◎" },
  { href: "#", label: "Affiliate Program", icon: "✧", disabled: true },
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
    if (href === "#") return false;
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
        <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-600">
          <span className="flex h-5 w-5 items-center justify-center text-xs opacity-40">
            {icon}
          </span>
          {label}
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
          active
            ? "bg-amber-500/12 font-medium text-amber-400 ring-1 ring-inset ring-amber-500/25"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
        }`}
      >
        <span className="flex h-5 w-5 items-center justify-center text-xs">
          {icon}
        </span>
        {label}
      </Link>
    );
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-white/[0.06] bg-[#0a0a0c] lg:flex">
        <div className="flex h-[60px] items-center gap-2.5 border-b border-white/[0.06] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/25">
            <span className="text-sm font-bold text-black">S</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            stella<span className="text-amber-400">host</span>
          </span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Service
            </p>
            <div className="space-y-0.5">
              {serviceLinks.map((l) => (
                <NavItem key={l.label} {...l} />
              ))}
              {user.role === "ADMIN" && (
                <NavItem href="/admin" label="Admin" icon="★" />
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Finance
            </p>
            <div className="space-y-0.5">
              {financeLinks.map((l) => (
                <NavItem key={l.label} {...l} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Account
            </p>
            <div className="space-y-0.5">
              {accountLinks.map((l) => (
                <NavItem key={l.label} {...l} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-4">
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
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Abmelden
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0c]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/[0.06] bg-[#0a0a0c]/95 backdrop-blur-xl lg:hidden">
        {[...
          serviceLinks.filter((l) => !l.disabled),
          ...financeLinks.filter((l) => !l.disabled),
        ].map((l) => {
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
