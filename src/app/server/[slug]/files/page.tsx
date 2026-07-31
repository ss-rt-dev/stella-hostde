"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type FileEntry = {
  name: string;
  type: "dir" | "file" | "link" | "other";
  size: number;
  mtime: number;
};

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(ts: number) {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function joinPath(base: string, name: string) {
  if (base === "/") return `/${name}`;
  return `${base.replace(/\/$/, "")}/${name}`;
}

function parentPath(path: string) {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/") || "/";
}

const QUICK = ["/", "/root", "/opt", "/home", "/var/log", "/etc"];

export default function ServerFilesPage() {
  const params = useParams();
  const slug = String(params.slug || "");

  const [serverName, setServerName] = useState("");
  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [editPath, setEditPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMeta, setEditMeta] = useState<{ size: number; truncated: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const [newFolder, setNewFolder] = useState("");
  const [newFile, setNewFile] = useState("");
  const [showNew, setShowNew] = useState(false);

  const crumbs = useMemo(() => {
    const parts = path.split("/").filter(Boolean);
    const list: { label: string; path: string }[] = [{ label: "/", path: "/" }];
    let acc = "";
    for (const p of parts) {
      acc += "/" + p;
      list.push({ label: p, path: acc });
    }
    return list;
  }, [path]);

  const load = useCallback(
    async (p: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/server/${slug}/files?action=list&path=${encodeURIComponent(p)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
        setPath(data.path || p);
        setEntries(data.entries || []);
        if (data.name) setServerName(data.name);
      } catch (e: any) {
        setError(e.message || "Laden fehlgeschlagen");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (slug) load("/");
  }, [slug, load]);

  async function openFile(full: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/server/${slug}/files?action=read&path=${encodeURIComponent(full)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lesen fehlgeschlagen");
      setEditPath(full);
      setEditContent(data.content ?? "");
      setEditMeta({ size: data.size, truncated: data.truncated });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveFile() {
    if (!editPath) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          path: editPath,
          content: editContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setEditMeta((m) =>
        m
          ? { ...m, size: new TextEncoder().encode(editContent).length, truncated: false }
          : m
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function doAction(
    body: Record<string, unknown>,
    reloadPath?: string
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aktion fehlgeschlagen");
      await load(reloadPath ?? path);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    const name = newFolder.trim().replace(/\//g, "");
    if (!name) return;
    await doAction({ action: "mkdir", path: joinPath(path, name) });
    setNewFolder("");
    setShowNew(false);
  }

  async function createFile() {
    const name = newFile.trim().replace(/\//g, "");
    if (!name) return;
    const full = joinPath(path, name);
    await doAction({ action: "write", path: full, content: "" });
    setNewFile("");
    setShowNew(false);
    openFile(full);
  }

  async function deleteEntry(name: string, type: string) {
    const full = joinPath(path, name);
    const msg =
      type === "dir"
        ? `Ordner „${name}“ inkl. Inhalt wirklich löschen?`
        : `Datei „${name}“ wirklich löschen?`;
    if (!confirm(msg)) return;
    await doAction({ action: "delete", path: full });
  }

  async function renameEntry(name: string) {
    const neu = prompt("Neuer Name:", name);
    if (!neu || neu === name) return;
    const clean = neu.trim().replace(/\//g, "");
    if (!clean) return;
    await doAction({
      action: "rename",
      from: joinPath(path, name),
      to: joinPath(path, clean),
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c] text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/servers"
            className="text-sm text-zinc-500 hover:text-amber-400"
          >
            ← Server
          </Link>
          <span className="text-sm font-medium text-white">
            Dateien {serverName && `· ${serverName}`}
          </span>
        </div>
        <Link
          href={`/server/${slug}/console`}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-black"
        >
          Console
        </Link>
      </header>

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 p-3 lg:w-48 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-600">
            Schnellzugriff
          </p>
          <div className="flex flex-wrap gap-1 lg:flex-col">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => load(q)}
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs ${
                  path === q || path.startsWith(q + "/")
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-zinc-400 hover:bg-white/5"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
            <button
              type="button"
              disabled={path === "/" || loading}
              onClick={() => load(parentPath(path))}
              className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              ↑ Hoch
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => load(path)}
              className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-300"
            >
              ↻
            </button>
            <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs">
              {crumbs.map((c, i) => (
                <span key={c.path} className="flex items-center gap-1">
                  {i > 0 && <span className="text-zinc-600">/</span>}
                  <button
                    type="button"
                    onClick={() => load(c.path)}
                    className="truncate text-amber-400/90 hover:underline"
                  >
                    {c.label}
                  </button>
                </span>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-black"
            >
              + Neu
            </button>
          </div>

          {showNew && (
            <div className="flex flex-wrap gap-3 border-b border-white/10 bg-[#121214] px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  placeholder="Ordnername"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  disabled={busy || !newFolder.trim()}
                  onClick={createFolder}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 disabled:opacity-40"
                >
                  Ordner
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={newFile}
                  onChange={(e) => setNewFile(e.target.value)}
                  placeholder="Dateiname"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  disabled={busy || !newFile.trim()}
                  onClick={createFile}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 disabled:opacity-40"
                >
                  Datei
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <p className="p-8 text-center text-sm text-zinc-500">Lade…</p>
            ) : entries.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-500">
                Ordner ist leer
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#0a0a0c] text-xs text-zinc-500">
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell">
                      Größe
                    </th>
                    <th className="hidden px-4 py-2 font-medium md:table-cell">
                      Geändert
                    </th>
                    <th className="px-4 py-2 font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((e) => {
                    const full = joinPath(path, e.name);
                    return (
                      <tr key={e.name} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              e.type === "dir" ? load(full) : openFile(full)
                            }
                            className="flex items-center gap-2 text-left hover:text-amber-400"
                          >
                            <span className="text-base leading-none">
                              {e.type === "dir"
                                ? "📁"
                                : e.type === "link"
                                  ? "🔗"
                                  : "📄"}
                            </span>
                            <span
                              className={
                                e.type === "dir"
                                  ? "font-medium text-zinc-100"
                                  : "text-zinc-300"
                              }
                            >
                              {e.name}
                            </span>
                          </button>
                        </td>
                        <td className="hidden px-4 py-2 text-zinc-500 sm:table-cell">
                          {e.type === "dir" ? "—" : formatSize(e.size)}
                        </td>
                        <td className="hidden px-4 py-2 text-zinc-500 md:table-cell">
                          {formatDate(e.mtime)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {e.type !== "dir" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openFile(full)}
                                className="rounded px-2 py-0.5 text-xs text-amber-400 hover:bg-amber-500/10"
                              >
                                Öffnen
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => renameEntry(e.name)}
                              className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-white/5"
                            >
                              Umben.
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteEntry(e.name, e.type)}
                              className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {editPath && (
          <div className="flex w-full flex-col border-t border-white/10 lg:w-[min(520px,45%)] lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-amber-400">
                  {editPath}
                </p>
                {editMeta && (
                  <p className="text-[10px] text-zinc-600">
                    {formatSize(editMeta.size)}
                    {editMeta.truncated && " · gekürzt (max. 512 KB)"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={saving || editMeta?.truncated}
                  onClick={saveFile}
                  className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-black disabled:opacity-40"
                >
                  {saving ? "…" : "Speichern"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPath(null);
                    setEditContent("");
                    setEditMeta(null);
                  }}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400"
                >
                  Schließen
                </button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              spellCheck={false}
              className="min-h-[280px] flex-1 resize-none bg-[#0c0c0e] p-3 font-mono text-xs leading-relaxed text-zinc-200 outline-none lg:min-h-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
