"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const FEATURES = [
  {
    title: "Sichere Plattform",
    text: "SSL, isolierte LXC-Container und sichere Zahlungsabwicklung über PayPal.",
    icon: "shield",
  },
  {
    title: "Schnelle Einrichtung",
    text: "Server in wenigen Minuten – automatische Provisionierung über Proxmox.",
    icon: "bolt",
  },
  {
    title: "Support im Panel",
    text: "Tickets und Team-Bewerbungen direkt im Dashboard, ohne Umwege.",
    icon: "support",
  },
  {
    title: "Stabile Infrastruktur",
    text: "Feste Ressourcen, SSD und moderne CPU – ohne sinnloses Overselling.",
    icon: "server",
  },
  {
    title: "Flexibles Guthaben",
    text: "Guthaben aufladen und Server monatsweise betreiben – transparent und planbar.",
    icon: "wallet",
  },
  {
    title: "Einfache Verwaltung",
    text: "Console, Dateimanager und Power-Steuerung an einem Ort.",
    icon: "panel",
  },
] as const;

const PANEL = [
  {
    title: "Server-Verwaltung",
    text: "Starten, stoppen und Status im Blick behalten – klar und schnell.",
  },
  {
    title: "Dateimanager",
    text: "Dateien direkt im Browser bearbeiten, ohne extra Client.",
  },
  {
    title: "Web-Console",
    text: "Terminal im Browser für Setup, Logs und Wartung.",
  },
  {
    title: "Software-Setups",
    text: "Minecraft, Discord-Bots oder Debian – je nach Bedarf.",
  },
  {
    title: "Support-System",
    text: "Tickets mit Übersicht und direkter Kommunikation zum Team.",
  },
  {
    title: "Konto & Sicherheit",
    text: "Profil, Passwort und Konto-Löschung (DSGVO) selbst steuern.",
  },
] as const;

const FAQ = [
  {
    q: "Wie starte ich?",
    a: "Registrieren, Guthaben per PayPal aufladen und im Dashboard einen Server konfigurieren. Die Erstellung läuft automatisch.",
  },
  {
    q: "Welche Zahlungsmittel gibt es?",
    a: "Aktuell PayPal. Das Guthaben wird für die monatliche Servergebühr verwendet.",
  },
  {
    q: "Wie schnell ist ein Server online?",
    a: "In der Regel innerhalb weniger Minuten nach erfolgreicher Erstellung – abhängig von Setup und Last.",
  },
  {
    q: "Kann ich meinen Account löschen?",
    a: "Ja. Unter Konto → Gefahrenzone kannst du Konto und zugehörige Daten selbst löschen.",
  },
] as const;

function FeatureIcon({ name }: { name: string }) {
  const cls = "h-5 w-5 text-amber-400";
  if (name === "shield")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  if (name === "bolt")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  if (name === "support")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  if (name === "server")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    );
  if (name === "wallet")
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export default function LandingPage() {
  const { status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [panelTab, setPanelTab] = useState(0);

  const dashHref = status === "authenticated" ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      {/* Promo */}
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm">
          <span className="text-amber-300">Angebot</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-300">
            Starte im Dashboard – Guthaben aufladen und Server in Minuten online
          </span>
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Host</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              Features
            </a>
            <a href="#panel" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              Panel
            </a>
            <a href="#faq" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline"
            >
              Anmelden
            </a>
            <a
              href={dashHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              LXC · Proxmox · Dashboard
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Hosting mit klarer Kontrolle –
              <span className="text-amber-400"> ohne Chaos.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
              Minecraft, Discord-Bots oder Debian-LXC. Provisionierung über Proxmox,
              Verwaltung im Panel – Console, Dateien und Support an einem Ort.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-yellow-400"
              >
                Kostenlos registrieren
              </a>
              <a
                href="#features"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-500/30 hover:bg-white/[0.06]"
              >
                Features ansehen
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-xs text-zinc-500">
              <div>
                <p className="text-lg font-semibold text-white">Minuten</p>
                <p>bis zum Server</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">LXC</p>
                <p>isolierte Container</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">PayPal</p>
                <p>Guthaben aufladen</p>
              </div>
            </div>
          </div>

          {/* Panel preview card */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-1 shadow-2xl shadow-black/40">
            <div className="rounded-xl border border-white/5 bg-[#0c0c0e] p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs text-zinc-500">stella-host · dashboard</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">mein-server</p>
                    <p className="text-xs text-zinc-500">2 vCPU · 2 GB RAM · 20 GB</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    RUNNING
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Console", "Dateien", "Stop"].map((l) => (
                    <div
                      key={l}
                      className="rounded-lg border border-white/5 bg-white/[0.03] py-2 text-center text-xs text-zinc-400"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-medium text-amber-400">Status</p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Node online · Setup bereit · Support aktiv
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Essential Features
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Performance und Kontrolle – die Grundlagen für stabiles Hosting.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-[#121214] p-5 transition hover:border-amber-500/25"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                  <FeatureIcon name={f.icon} />
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel section like Barry "Advanced Server Management" */}
      <section id="panel" className="border-t border-white/5 bg-[#0c0c0e]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Advanced Server Management
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Volle Kontrolle über deine Services – Panel für Performance und einfache Bedienung.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
              {PANEL.map((p, i) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setPanelTab(i)}
                  className={`shrink-0 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    panelTab === i
                      ? "bg-amber-500/15 font-medium text-amber-400 ring-1 ring-amber-500/25"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121214] p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white">
                {PANEL[panelTab].title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                {PANEL[panelTab].text}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {PANEL.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-xl border border-white/5 bg-black/30 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-zinc-200">{p.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Häufige Fragen</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Kurze Antworten vor dem Start
            </p>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-xl border transition ${
                    open
                      ? "border-amber-500/25 bg-[#121214]"
                      : "border-white/10 bg-[#121214]/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-medium text-white">{item.q}</span>
                    <span
                      className={`text-lg text-zinc-500 transition ${
                        open ? "rotate-45 text-amber-400" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-white/5 px-4 pb-4 pt-2 text-sm leading-relaxed text-zinc-400">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Bereit für deinen Server?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Account anlegen, Guthaben laden, Server starten.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/register"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
            >
              Registrieren
            </a>
            <a
              href={dashHref}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Zum Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-xs text-zinc-500 sm:px-6">
          <p className="font-medium text-zinc-400">
            Stella <span className="text-amber-400">Host</span> · © 2026
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/impressum" className="hover:text-amber-400">
              Impressum
            </a>
            <span>·</span>
            <a href="/datenschutz" className="hover:text-amber-400">
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
