"use client";

import { useEffect, useRef, useState } from "react";
import "../app/landing.css";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/landing.html");
        if (!res.ok) throw new Error("landing.html nicht gefunden");
        const html = await res.text();

        if (cancelled || !rootRef.current) return;

        // Body-Inhalt + Scripts extrahieren
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const body = doc.body;

        // Scripts entfernen und separat ausführen
        const scripts = Array.from(body.querySelectorAll("script"));
        scripts.forEach((s) => s.remove());

        rootRef.current.innerHTML = body.innerHTML;

        // Original-Scripts ausführen
        for (const s of scripts) {
          const el = document.createElement("script");
          if (s.src) {
            el.src = s.src;
          } else {
            el.textContent = s.textContent;
          }
          rootRef.current.appendChild(el);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Fehler beim Laden");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, color: "#f66" }}>
        Landingpage konnte nicht geladen werden: {error}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="landing-root"
      style={{ minHeight: "100vh", background: "#060607", color: "#f6f6f4" }}
    />
  );
}
