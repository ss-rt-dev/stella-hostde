"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdminRole } from "@/lib/roles";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/path";
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
  return null;
}

const LOGO_USER = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";
const LOGO_ADMIN = "https://cdn3.emoji.gg/emojis/18092-white.png";

type Props = {
  user: { name?: string | null; email?: string | null; role?: string };
  platformAdmin?: boolean;
  setupMode?: boolean;
  activeTeam?: {
    id: string;
    name: string;
    role: string;
    inviteCode?: string;
  } | null;
  teamCount?: number;
};

export function DashboardNav({
  user,
  platformAdmin,
  setupMode,
  activeTeam,
  teamCount,
}: Props) {
  const rawPath = usePathname() || "/";
  const { t, locale } = useI18n();
  const pathname = stripLocalePrefix(rawPath);
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
    { href: "/admin/support", labelKey: "nav_tickets", icon: "support" },
    { href: "/admin/activity", labelKey: "activities", icon: "board" },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function loc(href: string) {
    // Locale nur anhängen, wenn schon eine Locale-URL aktiv ist
    if (localeFromPath(rawPath)) return withLocalePrefix(href, locale);
    return href;
  }

  function localeFromPath(path: string): boolean {
    return stripLocalePrefix(path) !== path || path.match(/^\/[a-z]{2}(\/|$)/) !== null;
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
        href={loc(href)}
        prefetch
        className={`nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
          active
            ? "bg-amber-400/15 font-medium text-amber-300"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        }`}
      >
        <Icon type={icon} />
        <span>{label}</span>
      </Link>
    );
  }

  const mobileLinks = setupMode
    ? [
        { href: "/dashboard/teams", labelKey: "nav_teams" as TranslationKey, icon: "switch" },
        { href: "/dashboard/onboarding", labelKey: "onboarding_title" as TranslationKey, icon: "home" },
      ]
    : onAdmin
      ? platformLinks.slice(0, 5).map((l) => ({
          href: l.href,
          labelKey: l.labelKey,
          icon: l.icon,
        }))
      : [
          { href: "/dashboard", labelKey: "nav_overview" as TranslationKey, icon: "home" },
          { href: "/dashboard/todos", labelKey: "nav_tasks" as TranslationKey, icon: "check" },
          { href: "/dashboard/chat", labelKey: "nav_chat" as TranslationKey, icon: "chat" },
          { href: "/dashboard/team", labelKey: "nav_members" as TranslationKey, icon: "users" },
          { href: "/dashboard/support", labelKey: "nav_support" as TranslationKey, icon: "support" },
        ];

  return (
    <>
      {/* Desktop Sidebar – fixed, volle Höhe links */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/5 bg-[#0c0c0e] lg:flex">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-4">
          <Image src={logo} alt="Stella" width={32} height={32} className="rounded-lg" unoptimized />
          <div className="min-w-0">
            <Link href={loc("/dashboard")} className="block truncate text-sm font-semibold text-white">
              {activeTeam?.name || "Stella Dashboard"}
            </Link>
            <p className="truncate text-[11px] text-zinc-500">
              {activeTeam ? `${activeTeam.role} · ${user.email}` : user.email}
              {typeof teamCount === "number" && teamCount > 1 ? ` · ${teamCount}` : ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {!setupMode && (
            <>
              <div>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {t("workspace")}
                </p>
                <div className="space-y-0.5">
                  {workspaceLinks.map((l) => (
                    <NavLink key={l.href} href={l.href} label={t(l.labelKey)} icon={l.icon} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {t("account")}
                </p>
                <div className="space-y-0.5">
                  {accountLinks.map((l) => (
                    <NavLink key={l.href} href={l.href} label={t(l.labelKey)} icon={l.icon} />
                  ))}
                </div>
              </div>

              {isPlatformAdmin && (
                <div>
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {t("platform")}
                  </p>
                  <div className="space-y-0.5">
                    <NavLink href="/admin" label={t("admin_area")} icon="admin" exact />
                  </div>
                </div>
              )}
            </>
          )}

          {setupMode && (
            <div className="space-y-0.5">
              <NavLink href="/dashboard/teams" label={t("nav_teams")} icon="switch" />
              <NavLink href="/dashboard/onboarding" label={t("onboarding_title")} icon="home" />
            </div>
          )}

          {onAdmin && isPlatformAdmin && (
            <div>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {t("platform_admin")}
              </p>
              <div className="space-y-0.5">
                {platformLinks.map((l) => (
                  <NavLink
                    key={l.href}
                    href={l.href}
                    label={t(l.labelKey)}
                    icon={l.icon}
                    exact={l.exact}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/5 p-3">
          <Link
            href={loc(onAdmin ? "/dashboard" : "/dashboard/teams")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            {onAdmin ? t("to_workspace") : t("switch_teams")}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: loc("/login") })}
            className="w-full rounded-xl px-3 py-2 text-left text-[12px] text-zinc-500 hover:bg-white/5 hover:text-red-400"
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-[#0c0c0e]/95 px-3 py-3 backdrop-blur-md lg:hidden">
        <Image src={logo} alt="Stella" width={28} height={28} className="rounded-lg" unoptimized />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {activeTeam?.name || "Stella Dashboard"}
          </p>
          <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c0c0e]/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {mobileLinks.map((l) => {
            const active = isActive(l.href, l.href === "/admin" || l.href === "/dashboard");
            return (
              <Link
                key={l.href}
                href={loc(l.href)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] ${
                  active ? "text-amber-300" : "text-zinc-500"
                }`}
              >
                <Icon type={l.icon} />
                <span className="w-full truncate text-center">{t(l.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
