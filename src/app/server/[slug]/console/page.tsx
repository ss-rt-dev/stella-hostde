"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "@xterm/xterm/css/xterm.css";

export default function ServerConsolePage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const termRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Verbinde…");
  const [error, setError] = useState("");
  const [serverName, setServerName] = useState("");

  useEffect(() => {
    if (!slug) return;
    let disposed = false;
    let ws: WebSocket | null = null;
    let term: any = null;
    let fitAddon: any = null;
    let authed = false;

    async function connect() {
      try {
        const res = await fetch(`/api/server/${slug}/console`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Console nicht verfügbar");
          setStatus("Fehler");
          return;
        }
        if (disposed) return;
        setServerName(data.name || "");

        const xtermMod = await import("@xterm/xterm");
        const fitMod = await import("@xterm/addon-fit");

        if (disposed || !termRef.current) return;

        term = new xtermMod.Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          theme: {
            background: "#0a0a0c",
            foreground: "#e4e4e7",
            cursor: "#fbbf24",
          },
        });
        fitAddon = new fitMod.FitAddon();
        term.loadAddon(fitAddon);
        term.open(termRef.current);
        fitAddon.fit();

        setStatus("WebSocket…");

        // Proxmox verlangt Subprotokoll "binary"
        ws = new WebSocket(data.wsUrl, ["binary"]);
        ws.binaryType = "arraybuffer";

        const sendResize = () => {
          if (!ws || ws.readyState !== WebSocket.OPEN || !term) return;
          const cols = term.cols || 80;
          const rows = term.rows || 24;
          ws.send(`1:${cols}:${rows}:`);
        };

        ws.onopen = () => {
          const user = String(data.user || "root@pam").split("!")[0];
          ws?.send(`${user}:${data.ticket}\n`);
          setStatus("Auth…");
        };

        ws.onmessage = (ev) => {
          let text: string;
          if (typeof ev.data === "string") {
            text = ev.data;
          } else {
            text = new TextDecoder().decode(ev.data as ArrayBuffer);
          }

          if (!authed) {
            if (text === "OK" || text.startsWith("OK")) {
              authed = true;
              setStatus("Verbunden");
              sendResize();
              term.focus();
              const rest = text.replace(/^OK/, "");
              if (rest) term.write(rest);
              return;
            }
            // Manche Builds senden OK als separates Frame – sonst weiter
          }

          term.write(text);
        };

        ws.onerror = () => {
          setError(
            "WebSocket-Fehler – Proxmox muss per HTTPS mit gültigem Zertifikat " +
              "öffentlich erreichbar sein (z.B. Cloudflare Tunnel pve.stella-host.de). " +
              "Zusätzlich in Vercel: PROXMOX_USER=root@pam und PROXMOX_PASSWORD=… " +
              "(termproxy funktioniert mit API-Token oft nicht)."
          );
          setStatus("Fehler");
        };

        ws.onclose = (ev) => {
          setStatus(ev.code !== 1000 ? `Getrennt (${ev.code})` : "Getrennt");
        };

        term.onData((d: string) => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(d);
          }
        });

        const onResize = () => {
          fitAddon?.fit();
          sendResize();
        };
        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);
      } catch (e: any) {
        setError(e.message || "Fehler");
        setStatus("Fehler");
      }
    }

    connect();

    return () => {
      disposed = true;
      ws?.close();
      term?.dispose();
    };
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c] text-zinc-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/servers"
            className="text-sm text-zinc-500 hover:text-amber-400"
          >
            ← Server
          </Link>
          <span className="text-sm font-medium text-white">
            Console {serverName && `· ${serverName}`}
          </span>
          <span className="text-xs text-zinc-600">{status}</span>
        </div>
        <Link
          href={`/server/${slug}/files`}
          className="text-sm text-amber-400 hover:underline"
        >
          Dateien →
        </Link>
      </header>

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div ref={termRef} className="flex-1 p-2" style={{ minHeight: "70vh" }} />
    </div>
  );
}
