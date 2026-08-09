"use client";

import { useSession } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";

const FEATURES = [
  {
    title: "Mehrere Teams",
    text: "Bis zu 10 eigene Teams als Owner. Jedes Team ist komplett getrennt – Todos, Board, Mitglieder.",
  },
  {
    title: "Einladungscode",
    text: "Code aus Buchstaben + 3 Zahlen. Nach der Registrierung wirst du gefragt, ob du einen Code hast.",
  },
  {
    title: "Todos & Board",
    text: "Team-Aufgaben und persönliche Listen. Owner/Admins weisen zu – Mitglieder haken ab.",
  },
  {
    title: "Support",
    text: "Hilfe und Team-Bewerbungen (z.B. Discord) – unabhängig vom Team-Workspace.",
  },
] as const;

export default function LandingPage() {
  const { status } = useSession();
  const dashHref = status === "authenticated" ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <div className="border-b border-white/5 bg-[#111113]">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-zinc-400 sm:px-6">
          Stella Dashboard · Multi-Team · Todos · Support
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0c]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="text-[15px] font-semibold tracking-tight">
            Stella <span className="text-amber-400">Dashboard</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white sm:inline">
              Anmelden
            </a>
            <a
              href={dashHref}
              className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Zum Dashboard
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-amber-500/20 blur-[90px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 text-sm text-amber-400/90">Team-Workspace</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
            Ein Dashboard.
            <br />
            <span className="text-amber-400">Viele getrennte Teams.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-400">
            Owner legen Teams an, laden Mitglieder per Code ein und verteilen Aufgaben.
            Jedes Team hat eigene Todos, Mitglieder und Board – nichts vermischt sich.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/register"
              className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
            >
              Registrieren
            </a>
            <a
              href={dashHref}
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04]"
            >
              Anmelden
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">So funktioniert’s</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-[#121214] p-5"
              >
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-semibold text-white">Bereit?</p>
              <p className="text-sm text-zinc-500">
                Registrieren → Code eingeben oder Team erstellen → loslegen.
              </p>
            </div>
            <a
              href="/register"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
            >
              Jetzt starten
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
