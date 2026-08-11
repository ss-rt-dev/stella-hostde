"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
  author?: { name: string | null; email: string };
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    if (res.ok) setItems(data.announcements || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, active: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Fehler");
      return;
    }
    setTitle("");
    setBody("");
    load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Löschen?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Ankündigungen</h1>
        <p className="text-sm text-zinc-500">
          Werden ganz oben im User-Dashboard Overview angezeigt
        </p>
      </div>

      <form
        onSubmit={create}
        className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#121214] p-5"
      >
        <h2 className="font-semibold text-white">Neue Ankündigung</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none"
        />
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Text"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Veröffentlichen
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Laden…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-white/10 bg-[#121214] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">
                    {a.title}{" "}
                    {!a.active && (
                      <span className="text-xs text-zinc-500">(inaktiv)</span>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-400">
                    {a.body}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600">
                    {new Date(a.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(a.id, !a.active)}
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400"
                  >
                    {a.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] text-red-400"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-center text-sm text-zinc-500">Noch keine</p>
          )}
        </ul>
      )}
    </div>
  );
}
