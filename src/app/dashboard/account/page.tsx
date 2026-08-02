"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Gefahrenzone
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Name gespeichert");
    await update({ name: data.name });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    setBusy(true);
    setError("");
    setMsg("");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setMsg("Passwort geändert");
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");

    if (deleteConfirm !== "LÖSCHEN") {
      setDeleteError('Bitte genau „LÖSCHEN“ (in Großbuchstaben) eingeben');
      return;
    }

    if (
      !confirm(
        "Account wirklich unwiderruflich löschen? Alle Server und Daten gehen verloren."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirm: deleteConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "Löschen fehlgeschlagen");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Netzwerkfehler");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Konto</h1>
        <p className="text-sm text-zinc-500">Profil und Passwort</p>
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
        onSubmit={saveName}
        className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">Profil</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">E-Mail</label>
          <input
            disabled
            value={session?.user?.email || ""}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Anzeigename</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Name speichern
        </button>
      </form>

      <form
        onSubmit={changePassword}
        className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">Passwort ändern</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Aktuelles Passwort</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Wiederholen</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
        >
          Passwort ändern
        </button>
      </form>

      {/* Gefahrenzone – Konto löschen (DSGVO) */}
      <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5">
        <div>
          <h2 className="font-semibold text-red-400">Gefahrenzone</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Konto unwiderruflich löschen. Alle Server werden gestoppt und
            entfernt, Guthaben, Tickets und Profildaten werden gelöscht. Das
            kann nicht rückgängig gemacht werden.
          </p>
        </div>

        {deleteError && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {deleteError}
          </p>
        )}

        <form onSubmit={deleteAccount} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Passwort zur Bestätigung
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-red-500/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Zur Bestätigung <span className="font-mono text-red-400">LÖSCHEN</span>{" "}
              eingeben
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              required
              placeholder="LÖSCHEN"
              className="w-full rounded-xl border border-red-500/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={deleting || !deletePassword || deleteConfirm !== "LÖSCHEN"}
            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            {deleting ? "Konto wird gelöscht…" : "Konto endgültig löschen"}
          </button>
        </form>
      </div>
    </div>
  );
}
