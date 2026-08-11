"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

type Ann = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { name: string | null; email: string };
};

export default function BoardPage() {
  const { t } = useI18n();
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
    if (res.ok) {
      setItems(data.announcements || []);
      setCanPost(!!data.canPost);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
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
        setError(data.error || t("error"));
        setCreating(false);
        return;
      }
      setTitle("");
      setBody("");
      setPinned(false);
      setCreating(false);
      load();
    } catch {
      setError(t("network_error"));
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">{t("board_title")}</h1>
        <p className="text-sm text-zinc-500">{t("board_sub")}</p>
      </div>

      {canPost && (
        <form
          onSubmit={create}
          className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5"
        >
          <h2 className="font-semibold text-white">{t("new_announcement")}</h2>
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("title")}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <textarea
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("body")}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            {t("pin")}
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "…" : t("post")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">{t("loading_ellipsis")}</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">{t("no_announcements")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-white/10 bg-[#121214] p-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white">{a.title}</h3>
                {a.pinned && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">
                    {t("pinned")}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{a.body}</p>
              <p className="mt-3 text-[11px] text-zinc-600">
                {a.author?.name || a.author?.email} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
