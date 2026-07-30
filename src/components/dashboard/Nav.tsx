"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/servers", label: "Server", icon: "server" },
  { href: "/dashboard/deposit", label: "Billing", icon: "wallet" },
];

function Icon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  if (type === "home")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
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
  if (type === "admin")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  return null;
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

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-white lg:flex">
        <div className="flex h-[70px] items-center gap-3 border-b border-slate-100 px-5">
          <Image
            src="https://i.postimg.cc/25RvgMy6/sh-logo.png"
            alt="Stella Host"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            unoptimized
          />
          <div>
            <p className="text-[15px] font-bold text-slate-800 leading-tight">Stella Host</p>
            <p className="text-[11px] text-slate-400">Customer Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Home
          </p>
          <div className="space-y-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[#3a57e8] text-white shadow-md shadow-blue-500/25"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon type={l.icon} />
                  {l.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  pathname.startsWith("/admin")
                    ? "bg-[#3a57e8] text-white shadow-md shadow-blue-500/25"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon type="admin" />
                Admin
              </Link>
            )}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a57e8]/10 text-sm font-bold text-[#3a57e8]">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.name || "Kunde"}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            Abmelden
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="https://i.postimg.cc/25RvgMy6/sh-logo.png"
            alt="Stella Host"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            unoptimized
          />
          <span className="text-sm font-bold text-slate-800">Stella Host</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-slate-500"
        >
          Abmelden
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-slate-200 bg-white lg:hidden">
        {links.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? "text-[#3a57e8]" : "text-slate-400"
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
