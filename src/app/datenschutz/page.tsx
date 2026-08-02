import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz — Stella Host",
  description: "Datenschutzerklärung von Stella Host",
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-zinc-200">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-amber-400"
          >
            ← Zur Startseite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Datenschutz</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informationen zur Verarbeitung personenbezogener Daten (DSGVO)
          </p>
        </div>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">1. Verantwortlicher</h2>
          <p>
            Justin Scheer · Stella Host
            <br />
            E-Mail:{" "}
            <a
              href="mailto:teyoorll@gmail.com"
              className="text-amber-400 hover:underline"
            >
              teyoorll@gmail.com
            </a>
            <br />
            Telefon: +352 621 399 411
          </p>
          <p className="text-zinc-400">
            Anschrift: siehe{