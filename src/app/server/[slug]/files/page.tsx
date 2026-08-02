"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Entry = {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  mtime?: string;
};

function formatSize(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function parentPath(p: string) {
  if (!p || p === "/") return "/";
  const parts = p.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.length <= 1 ? "/" : parts.join("/") || "/";
}

export default function ServerFilesPage() {
  const params = useParams();
  const slug = String(params.slug || "");

  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editPath, setEditPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editBinary, setEditBinary] = useState(false);

  const load = useCallback(
    async (p: string) => {
      if (!slug) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/server/${slug}/files?action=list&path=${encodeURIComponent(p)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
        setPath(data.path || p);
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        if (data.name) setServerName(data.name);
      } catch (e: any) {
        setError(e.message || "Fehler");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    load("/");
  }, [load]);

  async function openFile(entry: Entry) {
    if (entry.isDir) {
      load(entry.path);
      return;
    }
    setBusy("Lade Datei…");
    setError("");
    try {
      const res = await fetch(
        `/api/server/${slug}/files?action=read&path=${encodeURIComponent(entry.path)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lesen fehlgeschlagen");
      setEditPath(entry.path);
      setEditBinary(!!data.binary);
      setEditContent(data.content ?? data.text ?? "");
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setBusy("");
    }
  }

  async function saveEdit() {
    if (!editPath || editBinary) return;
    setBusy("Speichern…");
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", path: editPath, content: editContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setEditPath(null);
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setBusy("");
    }
  }

  async function doMkdir() {
    const name = window.prompt("Ordnername");
    if (!name?.trim()) return;
    const target = path === "/" ? `/${name.trim()}` : `${path.replace(/\/$/, "")}/${name.trim()}`;
    setBusy("Ordner…");
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mkdir", path: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "mkdir fehlgeschlagen");
      await load(path);
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setBusy("");
    }
  }

  async function doDelete(entry: Entry) {
    if (!window.confirm(`„${entry.name}“ löschen?`)) return;
    setBusy("Löschen…");
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path: entry.path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Löschen fehlgeschlagen");
      await load(path);
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setBusy("");
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadErr("");
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setUploadProgress(`${i + 1}/${list.length}: ${file.name}`);
      const form = new FormData();
      form.append("file", file);
      form.append("path", path);
      try {
        const res = await fetch(`/api/server/${slug}/files`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload fehlgeschlagen: ${file.name}`);
      } catch (e: any) {
        setUploadErr(e.message || "Upload-Fehler");
        setUploadProgress(null);
        return;
      }
    }
    setUploadProgress(null);
    setUploadOpen(false);
    await load(path);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  const crumbs = path === "/" ? ["/"] : ["/", ...path.split("/").filter(Boolean)];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0c0c0e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Link href="/dashboard/servers" className="hover:text-amber-400">
                Server
              </Link>
              <span>/</span>
              <span className="truncate text-zinc-400">{serverName || slug}</span>
              <span>/</span>
              <span className="text-amber-400">Dateien</span>
            </div>
            <h1 className="mt-0.5 truncate text-lg font-semibold text-white">Dateimanager</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/server/${slug}/console`}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Console
            </Link>
            <button
              type="button"
              onClick={() => load(path)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Aktualisieren
            </button>
            <button
              type="button"
              onClick={doMkdir}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Neuer Ordner
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadErr("");
                setUploadProgress(null);
                setUploadOpen(true);
              }}
              className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300"
            >
              Upload
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 pb-3 text-xs sm:px-6">
          {crumbs.map((_, i) => {
            const crumbPath =
              i === 0 ? "/" : "/" + crumbs.slice(1, i + 1).join("/");
            const label = i === 0 ? "root" : crumbs[i];
            return (
              <span key={crumbPath + i} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-600">/</span>}
                <button
                  type="button"
                  onClick={() => load(crumbPath)}
                  className="rounded px-1.5 py-0.5 text-zinc-400 hover:bg-white/5 hover:text-amber-300"
                >
                  {label}
                </button>
              </span>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {busy && (
          <p className="mb-3 text-xs text-zinc-500">{busy}</p>
        )}

        {/* Drop hint on list */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`overflow-hidden rounded-xl border transition ${
            dragOver
              ? "border-amber-400/50 bg-amber-500/10"
              : "border-white/10 bg-[#121214]"
          }`}
        >
          <div className="grid grid-cols-[1fr_90px_100px] gap-2 border-b border-white/5 px-4 py-2 text-[11px] uppercase tracking-wide text-zinc-500 sm:grid-cols-[1fr_100px_120px_80px]">
            <span>Name</span>
            <span className="hidden sm:inline">Größe</span>
            <span>Typ</span>
            <span className="text-right">Aktion</span>
          </div>

          {path !== "/" && (
            <button
              type="button"
              onClick={() => load(parentPath(path))}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/[0.04]"
            >
              <span className="text-amber-400/80">↑</span>
              ..
            </button>
          )}

          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-zinc-500">Laden…</p>
          ) : entries.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-zinc-500">
              Ordner leer — Upload oder Datei hierher ziehen
            </p>
          ) : (
            entries.map((e) => (
              <div
                key={e.path}
                className="grid grid-cols-[1fr_90px_100px] items-center gap-2 border-b border-white/5 px-4 py-2.5 last:border-0 hover:bg-white/[0.03] sm:grid-cols-[1fr_100px_120px_80px]"
              >
                <button
                  type="button"
                  onClick={() => openFile(e)}
                  className="truncate text-left text-sm text-zinc-200 hover:text-amber-300"
                >
                  <span className="mr-2 text-zinc-500">{e.isDir ? "📁" : "📄"}</span>
                  {e.name}
                </button>
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {e.isDir ? "—" : formatSize(e.size)}
                </span>
                <span className="text-xs text-zinc-500">{e.isDir ? "Ordner" : "Datei"}</span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => doDelete(e)}
                    className="rounded px-2 py-1 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => !uploadProgress && setUploadOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121214] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Dateien hochladen</h2>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="text-zinc-500 hover:text-white"
                disabled={!!uploadProgress}
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Ziel: <span className="text-zinc-300">{path}</span> · max. 1 MB pro Datei
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition ${
                dragOver
                  ? "border-amber-400 bg-amber-500/10"
                  : "border-white/15 bg-black/30"
              }`}
            >
              <p className="text-sm text-zinc-300">Dateien hierher ziehen</p>
              <p className="mt-1 text-xs text-zinc-500">oder</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
              >
                Dateien wählen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {uploadProgress && (
              <p className="mt-3 text-center text-xs text-amber-400">{uploadProgress}</p>
            )}
            {uploadErr && (
              <p className="mt-3 text-center text-xs text-red-400">{uploadErr}</p>
            )}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editPath && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#121214] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm text-zinc-300">{editPath}</p>
              <div className="flex gap-2">
                {!editBinary && (
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Speichern
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditPath(null)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
                >
                  Schließen
                </button>
              </div>
            </div>
            {editBinary ? (
              <p className="p-6 text-sm text-zinc-500">Binärdatei – nur Upload/Download, kein Editor.</p>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[50vh] flex-1 resize-none bg-[#0a0a0c] p-4 font-mono text-xs text-zinc-200 outline-none"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
