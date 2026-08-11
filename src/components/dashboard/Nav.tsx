"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdminRole } from "@/lib/roles";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

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
  if (type === "chat")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
  if (type === "switch")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    );
  if (type === "admin")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
  activeTeam,
  teamCount = 0,
  setupMode = false,
  platformAdmin = false,
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
  setupMode?: boolean;
  platformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isPlatformAdmin = platformAdmin || isAdminRole(user.role);
  const onAdmin = pathname.startsWith("/admin");
  const logo = onAdmin ? LOGO_ADMIN : LOGO_USER;

  const workspaceLinks: { href: string; labelKey: TranslationKey; icon: string }[] = [
    { href: "/dashboard", labelKey: "nav_overview", icon: "home" },
    { href: "/dashboard/todos", labelKey: "nav_tasks", icon: "check" },
    { href: "/dashboard/chat", labelKey: "nav_chat", icon: "chat" },
    { href: "/dashboard/team", labelKey: "nav_members", icon: "users" },
    { href: "/dashboard/board", labelKey: "nav_board", icon: "board" },
  ];

  const accountLinks: { href: string; labelKey: TranslationKey; icon: string }[] = [
    { href: "/dashboard/support", labelKey: "nav_support", icon: "support" },
    { href: "/dashboard/account", labelKey: "nav_account", icon: "user" },
    { href: "/dashboard/teams", labelKey: "nav_teams", icon: "switch" },
  ];

  const platformLinks: {
    href: string;
    labelKey: TranslationKey;
    icon: string;
    exact?: boolean;
  }[] = [
    { href: "/admin", labelKey: "overview", icon: "admin", exact: true },
    { href: "/admin/announcements", labelKey: "announcements", icon: "board" },
    { href: "/admin/teams", labelKey: "teams", icon: "switch" },
    { href: "/admin/users", labelKey: "users", icon: "users" },
    { href: "/admin/todos", labelKey: "nav_tasks", icon: "check" },
    { href: "/admin/support", labelKey: "admin_tickets", icon: "support" },
    { href: "/admin/activity", labelKey: "activities", icon: "activity" },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function NavLink({
    href,
    label,
    icon,
    exact,
  }: {
    href: string;
    label: string;
    icon: string;
    exact?: boolean;
  }) {
    const active = isActive(href, exact);
    return (
      <Link
        href={href}
        prefetch
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
      <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
          <Image src={logo} alt="Stella" width={36} height={36} className="h-9 w-9 object-contain" unoptimized />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Stella{" "}
            <span className="text-amber-400">{onAdmin ? t("nav_admin") : t("dashboard")}</span>
          </span>
        </div>

        {onAdmin ? (
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">{t("platform_admin")}</p>
            <p className="text-[11px] text-zinc-500">{t("teams_users_tickets")}</p>
            <Link
              href="/dashboard"
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-300"
            >
              {t("to_workspace")}
            </Link>
          </div>
        ) : (
          activeTeam &&
          !setupMode && (
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{activeTeam.name}</p>
              <p className="text-[11px] text-zinc-500">{activeTeam.role}</p>
              {activeTeam.inviteCode && (
                <p className="mt-1 font-mono text-[10px] tracking-wider text-amber-400/80">
                  {activeTeam.inviteCode}
                </p>
              )}
              <Link
                href="/dashboard/teams"
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-amber-400 transition hover:bg-white/[0.08]"
              >
                {t("switch_teams")} ({teamCount})
              </Link>
            </div>
          )
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {onAdmin ? (
            <>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                {t("platform")}
              </p>
              {platformLinks.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={t(l.labelKey)}
                  icon={l.icon}
                  exact={l.exact}
                />
              ))}
            </>
          ) : (
            <>
              {!setupMode && (
                <>
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    {t("workspace")}
                  </p>
                  {workspaceLinks.map((l) => (
                    <NavLink
                      key={l.href}
                      href={l.href}
                      label={t(l.labelKey)}
                      icon={l.icon}
                    />
                  ))}
                </>
              )}

              <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                {t("account")}
              </p>
              {accountLinks.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={t(l.labelKey)}
                  icon={l.icon}
                />
              ))}

              {isPlatformAdmin && (
                <>
                  <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    {t("platform_admin")}
                  </p>
                  <NavLink href="/admin" label={t("admin_area")} icon="admin" exact />
                </>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-500/15 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/25">
              {isPlatformAdmin ? (
                <Image src={LOGO_ADMIN} alt="Admin" width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
              ) : (
                (user.name || user.email || "U")[0].toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name || t("member")}
              </p>
              <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      <header className="glass-strong sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link
          href={onAdmin ? "/admin" : setupMode ? "/dashboard/teams" : "/dashboard"}
          className="flex items-center gap-2"
        >
          <Image src={logo} alt="Stella" width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
          <span className="font-semibold text-white">
            {onAdmin ? (
              <>
                Stella <span className="text-amber-400">{t("nav_admin")}</span>
              </>
            ) : (
              activeTeam?.name || (
                <>
                  Stella <span className="text-amber-400">{t("dashboard")}</span>
                </>
              )
            )}
          </span>
        </Link>
        <Link
          href={onAdmin ? "/dashboard" : "/dashboard/teams"}
          className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-semibold text-black"
        >
          {onAdmin ? t("workspace") : t("teams")}
        </Link>
      </header>

      {onAdmin ? (
        <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex lg:hidden">
          {[
            { href: "/admin", labelKey: "nav_home" as TranslationKey, icon: "admin" },
            { href: "/admin/announcements", labelKey: "nav_news" as TranslationKey, icon: "board" },
            { href: "/admin/teams", labelKey: "teams" as TranslationKey, icon: "switch" },
            { href: "/admin/support", labelKey: "nav_tickets" as TranslationKey, icon: "support" },
          ].map((l) => {
            const active = isActive(l.href, l.href === "/admin");
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                className={`nav-link flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                  active ? "active text-amber-400" : "text-zinc-500"
                }`}
              >
                <Icon type={l.icon} />
                {t(l.labelKey)}
              </Link>
            );
          })}
        </nav>
      ) : (
        !setupMode && (
          <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex lg:hidden">
            {[
              { href: "/dashboard", labelKey: "nav_home" as TranslationKey, icon: "home" },
              { href: "/dashboard/todos", labelKey: "nav_tasks" as TranslationKey, icon: "check" },
              { href: "/dashboard/chat", labelKey: "nav_chat" as TranslationKey, icon: "chat" },
              { href: "/dashboard/team", labelKey: "team" as TranslationKey, icon: "users" },
            ].map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch
                  className={`nav-link flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                    active ? "active text-amber-400" : "text-zinc-500"
                  }`}
                >
                  <Icon type={l.icon} />
                  {t(l.labelKey)}
                </Link>
              );
            })}
          </nav>
        )
      )}
    </>
  );
}
