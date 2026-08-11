"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

export default function AccountPage() {
  const { t } = useI18n();
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const deleteWord = t("delete_confirm_word");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
      } else {
        setMsg(t("name_saved"));
        await update({ name });
      }
    } catch {
      setError(t("network_error"));
    }
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== passwordConfirm) {
      setError(t("passwords_mismatch"));
      return;
    }
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
      } else {
        setMsg(t("password_changed"));
        setCurrentPassword("");
        setNewPassword("");
        setPasswordConfirm("");
      }
    } catch {
      setError(t("network_error"));
    }
    setBusy(false);
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteConfirm !== deleteWord) return;
    if (!confirm(t("delete_account_confirm"))) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, confirm: deleteConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || t("delete_failed"));
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError(t("network_error"));
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{t("account_title")}</h1>
        <p className="text-sm text-zinc-500">{t("account_sub")}</p>
      </div>

      {(msg || error) && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm ${
            error
              ? "border border-red-500/20 bg-red-500/10 text-red-400"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {error || msg}
        </div>
      )}

      <form
        onSubmit={saveProfile}
        className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">{t("profile")}</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("email")}</label>
          <input
            disabled
            value={session?.user?.email || ""}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {t("save_name")}
        </button>
      </form>

      <form
        onSubmit={changePassword}
        className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">{t("change_password")}</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("current_password")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("new_password")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">{t("confirm_password")}</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
        >
          {t("change_password")}
        </button>
      </form>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5">
        <h2 className="text-sm font-semibold text-red-400">{t("danger_zone")}</h2>
        <p className="mt-1 text-xs text-zinc-500">{t("danger_zone_text")}</p>
        {deleteError && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
            {deleteError}
          </p>
        )}
        <form onSubmit={deleteAccount} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-0.5 block text-[11px] text-zinc-500">{t("password")}</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              className="w-full rounded-lg border border-red-500/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] text-zinc-500">
              {t("confirm_delete_label")}{" "}
              <span className="font-mono text-red-400">{deleteWord}</span>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              required
              placeholder={deleteWord}
              className="w-full rounded-lg border border-red-500/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={deleting || !deletePassword || deleteConfirm !== deleteWord}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40"
          >
            {deleting ? "…" : t("delete_account")}
          </button>
        </form>
      </div>
    </div>
  );
}
