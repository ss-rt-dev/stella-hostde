"use client";

import { useEffect, useState } from "react";

export function ScrollControls() {
  const [show, setShow] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    function update() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(max > 80);
      setAtTop(y < 40);
      setAtBottom(y >= max - 40);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[90] flex flex-col gap-2 lg:bottom-6">
      <button
        type="button"
        aria-label="Nach oben"
        disabled={atTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="glass-strong flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 text-amber-400 shadow-lg transition hover:border-amber-400/50 hover:bg-amber-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
        style={{
          background: "rgba(12, 12, 14, 0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Nach unten"
        disabled={atBottom}
        onClick={() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          })
        }
        className="glass-strong flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 text-amber-400 shadow-lg transition hover:border-amber-400/50 hover:bg-amber-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
        style={{
          background: "rgba(12, 12, 14, 0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
