"use client";

import { useEffect, useState } from "react";

type Ann = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { name: string | null; email: string };
};

export default function BoardPage() {
  const [items, setItems] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [canPost, setCanPost] = useState(false);

  async function load() {
    const res = await fetch("/api/team/announcements");
    const data = await res.json();
    if (res.ok) setItems(data.announcements || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Staff check via members endpoint
    fetch("/api/team/members")
      .then((r) => r.json())
      .then((d) => setCanPost(Boolean(d.canManage)))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/team/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, pinned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }
      setTitle("");
      setBody("");
      setPinned(false);
      load();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Board</h1>
        <p className="text-sm text-zinc-500">Ankündigungen fürs Team</p>
      </div>

      {canPost && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">Neue Ankündigung</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Text"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-amber-400"
            />
            Anpinnen
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : "Veröffentlichen"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Laden…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121214] px-5 py-12 text-center text-sm text-zinc-500">
          Noch keine Ankündigungen
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-white/10 bg-[#121214] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    PIN
                  </span>
                )}
                <h2 className="font-semibold text-white">{a.title}</h2>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {a.body}
              </p>
              <p className="mt-3 text-[11px] text-zinc-600">
                {a.author.name || a.author.email} ·{" "}
                {new Date(a.createdAt).toLocaleString("de-DE")}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
