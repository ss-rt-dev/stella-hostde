"use client";

import { useEffect, useRef } from "react";
import "../app/landing.css";
import { landingMarkup, landingScript } from "./landing-content";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !rootRef.current) return;
    ran.current = true;

    rootRef.current.innerHTML = landingMarkup;

    const el = document.createElement("script");
    el.textContent = landingScript;
    rootRef.current.appendChild(el);
  }, []);

  return (
    <div
      ref={rootRef}
      className="landing-root"
      style={{ minHeight: "100vh", background: "#060607", color: "#f6f6f4" }}
    />
  );
}
