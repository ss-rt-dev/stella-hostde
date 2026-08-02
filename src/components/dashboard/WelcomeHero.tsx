"use client";

import Link from "next/link";
import { useRef } from "react";

export function WelcomeHero({ displayName }: { displayName: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", `${x * 24}px`);
    el.style.setProperty("--py", `${y * 16}px`);
    el.style.setProperty("--px2", `${x * -18}px`);
    el.style.setProperty("--py2", `${y * -12}px`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
    el.style.setProperty("--px2", "0px");
    el.style.setProperty("--py2", "0px");
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden rounded-2xl border border-amber-500/25 p-6 sm:p-8 glass-amber"
      style={
        {
          "--px": "0px",
          "--py": "0px",
          "--px2": "0px",
          "--py2": "0px",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 gold-shimmer opacity-80" />

      <div
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-400/30 blur-3xl orb-float parallax-layer"
        style={{ transform: "translate(var(--px), var(--py))" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-yellow-500/25 blur-3xl orb-float-delayed parallax-layer"
        style={{ transform: "translate(var(--px2), var(--py2))" }}
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl"
        style={{
          animation: "pulse-glow 4s ease-in-out infinite",
          transform: "translate(calc(var(--px) * 0.5), calc(var(--py) * 0.5))",
        }}
      />

      <div
        className="relative parallax-layer"
        style={{
          transform: "translate(calc(var(--px) * 0.15), calc(var(--py) * 0.15))",
        }}
      >
        <h2 className="text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
          Hallo {displayName}!
        </h2>
        <p className="mt-2 max-w-md text-sm text-zinc-300/90">
          Verwalte Server und Zahlungen – Stella Host.
        </p>
        <Link
          href="/dashboard/servers"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#1a1a1c] px-5 py-2.5 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/40 transition hover:border-white/25 hover:bg-[#222226] hover:text-white"
        >
          Server erstellen
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
