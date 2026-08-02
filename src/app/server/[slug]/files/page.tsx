"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileIcon } from "@/components/FileIcon";

type Entry = {
  name: string;
  type: "dir" | "file" | "link" | "other";
  size: number;
  mtime: number;
};

function formatSize(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function joinPath(base: string, name: string) {
  if (base === "/") return `/${name}`;
  return `${base.replace(/\/$/, "")}/${name}`;
}

function parentPath(p: string) {
  if (!p || p === "/") return "/";
  const parts = p.replace(/\/$/, "").split("/").filter(Boolean);
  parts.pop();
  return parts.length ? "/" + parts.join("/") : "/";
}

export default function ServerFilesPage() {
  const params = useParams();
  const slug = String(params.slug || "");

  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function openEntry(e: Entry) {
    const full = joinPath(path, e.name);
    if (e.type === "dir") {
      load(full);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/server/${slug}/files?action=read&path=${encodeURIComponent(full)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lesen fehlgeschlagen");
      setEditPath(full);
      setEditBinary(!!data.binary);
      setEditContent(data.content ?? data.text ?? "");
    } catch (err: any) {
      setError(err.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editPath || editBinary) return;
    setBusy(true);
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
      setBusy(false);
    }
  }

  async function doMkdir() {
    const name = window.prompt("Ordnername");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mkdir", path: joinPath(path, name.trim()) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "mkdir fehlgeschlagen");
      await load(path);
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(e: Entry) {
    if (!window.confirm(`„${e.name}“ löschen?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/server/${slug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path: joinPath(path, e.name) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Löschen fehlgeschlagen");
      await load(path);
    } catch (err: any) {
      setError(err.message || "Fehler");
    } finally {
      setBusy(false);
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
        const res = await fetch(`/api/server/${slug}/files`, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload: ${file.name}`);
      } catch (err: any) {
        setUploadErr(err.message || "Upload-Fehler");
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
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c] text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/servers" className="text-sm text-zinc-500 hover:text-amber-400">
            ← Server
          </Link>
          <span className="text-sm font-medium text-white">
            Dateien {serverName && `· ${serverName}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/server/${slug}/console`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-amber-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Console
          </Link>
          <button
            type="button"
            onClick={() => load(path)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Aktualisieren
          </button>
          <button
            type="button"
            onClick={doMkdir}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Ordner
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadErr("");
              setUploadProgress(null);
              setUploadOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs">
        <button
          type="button"
          disabled={path === "/" || loading}
          onClick={() => load(parentPath(path))}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-zinc-300 disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Hoch
        </button>
        <span className="truncate font-mono text-amber-400/90">{path}</span>
      </div>

      <main className="flex-1 overflow-auto">
        {loading ? (
          <p className="p-8 text-center text-sm text-zinc-500">Lade…</p>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">Ordner ist leer</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0a0a0c] text-xs text-zinc-500">
              <tr className="border-b border-white/5">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Größe</th>
                <th className="px-4 py-2 text-right font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((e) => (
                <tr key={e.name} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEntry(e)}
                      className="flex items-center gap-2 text-left hover:text-amber-400"
                    >
                      <FileIcon name={e.name} type={e.type} />
                      <span className={e.type === "dir" ? "font-medium text-zinc-100" : "text-zinc-300"}>
                        {e.name}
                      </span>
                    </button>
                  </td>
                  <td className="hidden px-4 py-2 text-zinc-500 sm:table-cell">
                    {e.type === "dir" ? "—" : formatSize(e.size)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => doDelete(e)}
                      className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => !uploadProgress && setUploadOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121214] p-5 shadow-2xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Upload</h2>
              <button type="button" onClick={() => setUploadOpen(false)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Ziel: <span className="text-zinc-300">{path}</span> · max. 1 MB
            </p>
            <div
              onDragOver={(ev) => {
                ev.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 ${
                dragOver ? "border-amber-400 bg-amber-500/10" : "border-white/15 bg-black/30"
              }`}
            >
              <svg className="mb-2 h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-zinc-300">Dateien hierher ziehen</p>
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
                onChange={(ev) => {
                  if (ev.target.files?.length) void uploadFiles(ev.target.files);
                  ev.target.value = "";
                }}
              />
            </div>
            {uploadProgress && <p className="mt-3 text-center text-xs text-amber-400">{uploadProgress}</p>}
            {uploadErr && <p className="mt-3 text-center text-xs text-red-400">{uploadErr}</p>}
          </div>
        </div>
      )}

      {editPath && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#121214]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="truncate font-mono text-xs text-amber-400">{editPath}</p>
              <div className="flex gap-2">
                {!editBinary && (
                  <button type="button" onClick={saveEdit} className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
                    Speichern
                  </button>
                )}
                <button type="button" onClick={() => setEditPath(null)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400">
                  Schließen
                </button>
              </div>
            </div>
            {editBinary ? (
              <p className="p-6 text-sm text-zinc-500">Binärdatei – kein Texteditor.</p>
            ) : (
              <textarea
                value={editContent}
                onChange={(ev) => setEditContent(ev.target.value)}
                spellCheck={false}
                className="min-h-[50vh] flex-1 resize-none bg-[#0c0c0e] p-3 font-mono text-xs text-zinc-200 outline-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
