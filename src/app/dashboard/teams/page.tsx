"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import Link from "next/link";

type TeamRow = {
  id: string;
  name: string;
  inviteCode?: string;
  role: string;
  memberCount: number;
  isOwner: boolean;
};

export default function TeamsPage() {
  const { t } = useI18n();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [maxOwned, setMaxOwned] = useState(10);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const res = await fetch("/api/teams");
    const data = await res.json();
    if (res.ok) {
      setTeams(data.teams || []);
      setOwnedCount(data.ownedCount || 0);
      setMaxOwned(data.maxOwned || 10);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function select(teamId: string) {
    await fetch("/api/teams/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    window.location.assign("/dashboard");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
        setCreating(false);
        return;
      }
      await select(data.team.id);
    } catch {
      setError(t("network_error"));
      setCreating(false);
    }
  }

  if (loading) return <p className="text-zinc-500">{t("loading_ellipsis")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t("your_teams")}</h1>
          <p className="text-sm text-zinc-500">
            {t("teams_separated")} · {ownedCount}/{maxOwned} {t("as_owner")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/onboarding"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            {t("enter_code")}
          </Link>
          {ownedCount < maxOwned && (
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
            >
              {showCreate ? t("close") : t("new_team")}
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={create}
          className="space-y-3 rounded-2xl border border-amber-500/20 bg-[#121214] p-5"
        >
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">{t("team_name")}</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("my_team_placeholder")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : t("create_team")}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
        {teams.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">{t("no_teams_yet")}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-zinc-100">{team.name}</p>
                  <p className="text-xs text-zinc-500">
                    {team.role} · {team.memberCount}{" "}
                    {team.memberCount === 1 ? t("member_one") : t("member_many")}
                    {team.inviteCode ? ` · ${team.inviteCode}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => select(team.id)}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black"
                >
                  {t("select_team")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
