"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Ann = {
  id: string;
  title: string;
  body: string;
};

type TodoRow = {
  id: string;
  title: string;
  priority: string;
  scope: string;
  assignee?: { name: string | null; email: string } | null;
};

type TeamAnn = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  author?: { name: string | null; email: string } | null;
};

export function DashboardHome({
  displayName,
  teamName,
  teamTitle,
  role,
  memberCount,
  openTeamTodos,
  myOpenTodos,
  inviteCode,
  platformAnnouncements,
  recentTodos,
  announcements,
}: {
  displayName: string;
  teamName: string;
  teamTitle: string | null;
  role: string;
  memberCount: number;
  openTeamTodos: number;
  myOpenTodos: number;
  inviteCode?: string | null;
  platformAnnouncements: Ann[];
  recentTodos: TodoRow[];
  announcements: TeamAnn[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {platformAnnouncements.length > 0 && (
        <div className="space-y-2">
          {platformAnnouncements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-5 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                {t("announcements")}
              </p>
              <p className="mt-1 font-semibold text-white">{a.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            {teamName}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {t("hello")}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("dashboard")}: {t("member")}
            {teamTitle ? (
              <>
                {" · "}{t("team")}:{" "}
                <span className="text-amber-400">{teamTitle}</span>
              </>
            ) : null}
            {" · "}
            {role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/todos"
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-black"
          >
            + {t("new_task")}
          </Link>
          <Link
            href="/dashboard/chat"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            {t("nav_chat")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("members")} value={String(memberCount)} href="/dashboard/team" />
        <Stat label={t("team_tasks")} value={String(openTeamTodos)} href="/dashboard/todos" />
        <Stat label={t("my_open")} value={String(myOpenTodos)} href="/dashboard/todos" />
        <Stat label={t("nav_board")} value="→" href="/dashboard/board" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#121214] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">{t("open_tasks")}</h2>
            <Link href="/dashboard/todos" className="text-xs text-amber-400 hover:underline">
              {t("view_all")}
            </Link>
          </div>
          {recentTodos.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">{t("no_open_tasks")}</p>
          ) : (
            <ul className="space-y-2">
              {recentTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2"
                >
                  <span className="truncate text-sm text-zinc-200">{todo.title}</span>
                  <span className="shrink-0 text-[10px] uppercase text-zinc-500">
                    {todo.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121214] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">{t("team_news")}</h2>
            <Link href="/dashboard/board" className="text-xs text-amber-400 hover:underline">
              {t("view_all")}
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">{t("no_announcements")}</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id}>
                  <p className="text-sm font-medium text-zinc-100">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {inviteCode && (
        <div className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-4">
          <p className="text-xs text-zinc-500">{t("invite_code")}</p>
          <p className="mt-1 font-mono text-lg tracking-wider text-amber-400">{inviteCode}</p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#121214] p-4 transition hover:border-amber-500/30"
    >
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </Link>
  );
}
