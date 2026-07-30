"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ServerFilesPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const [server, setServer] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/server/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Fehler");
        setServer(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] p-8 text-zinc-500">Lade…</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/servers" className="text-sm text-zinc-500 hover:text-amber-400">
            ← Server
          </Link>
          <span className="text-sm font-medium">
            Dateien {server?.name && `· ${server.name}`}
          </span>
        </div>
        <Link
          href={`/server/${slug}/console`}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-black"
        >
          Console öffnen
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {error && (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 space-y-4">
          <h1 className="text-lg font-semibold text-white">Dateizugriff</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ein vollständiger Dateimanager im Browser braucht eine direkte Verbindung zum
            Container (SFTP/SSH). Von Vercel aus ist das ohne extra Tunnel nicht möglich.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Empfohlen:</strong> Nutze die{" "}
            <Link href={`/server/${slug}/console`} className="text-amber-400 hover:underline">
              Web-Console
            </Link>{" "}
            für Shell-Zugriff (<code className="text-zinc-300">ls</code>,{" "}
            <code className="text-zinc-300">nano</code>,{" "}
            <code className="text-zinc-300">cat</code>, …).
          </p>
          {server?.ipAddress && (
            <p className="text-sm text-zinc-500">
              SFTP/SSH (wenn IP bekannt):{" "}
              <code className="text-amber-400/90">sftp root@{server.ipAddress}</code>
            </p>
          )}
          <div className="rounded-xl border border-white/5 bg-black/30 p-4 text-xs text-zinc-500 font-mono">
            <p>Status: {server?.status}</p>
            <p>Hostname: {server?.hostname}</p>
            <p>VMID: {server?.proxmoxVmid ?? "—"}</p>
            <p>
              Specs: {server?.cpu} vCPU · {server?.ramMb} MB · {server?.diskGb} GB
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
