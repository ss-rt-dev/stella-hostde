"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function OnboardingPage() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"join" | "create">("join");

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
        setLoading(false);
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError(t("network_error"));
      setLoading(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
        setLoading(false);
        return;
      }
      if (data.team?.id) {
        await fetch("/api/teams/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: data.team.id }),
        });
      }
      window.location.assign("/dashboard");
    } catch {
      setError(t("network_error"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{t("onboarding_title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("onboarding_sub")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`rounded-xl py-2.5 text-sm font-medium ${
            mode === "join"
              ? "bg-amber-400 text-black"
              : "border border-white/10 text-zinc-300"
          }`}
        >
          {t("have_invite")}
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-xl py-2.5 text-sm font-medium ${
            mode === "create"
              ? "bg-amber-400 text-black"
              : "border border-white/10 text-zinc-300"
          }`}
        >
          {t("or_create_team")}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      {mode === "join" ? (
        <form onSubmit={join} className="space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">{t("invite_code")}</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "…" : t("join")}
          </button>
        </form>
      ) : (
        <form onSubmit={create} className="space-y-4 rounded-2xl border border-white/10 bg-[#121214] p-5">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">{t("team_name")}</label>
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
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "…" : t("create_team_btn")}
          </button>
        </form>
      )}
    </div>
  );
}
