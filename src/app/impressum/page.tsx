import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — Stella Host",
  description: "Impressum und Anbieterkennzeichnung von Stella Host",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-zinc-200">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-amber-400"
          >
            ← Zur Startseite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Impressum</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Anbieterkennzeichnung gemäß den anwendbaren Vorschriften
          </p>
        </div>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">Diensteanbieter</h2>
          <p>
            Justin Scheer
            <br />
            <span className="text-zinc-400">Stella Host</span>
          </p>
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-200/90">
            <strong className="text-amber-400">Anschrift:</strong> bitte vom
            Betreiber eintragen (Straße, Hausnummer, PLZ, Ort, Land).
            <br />
            <span className="text-xs text-amber-200/70">
              Ohne vollständige ladungsfähige Anschrift ist die
              Anbieterkennzeichnung unvollständig – besonders bei kostenpflichtigen
              Angeboten.
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">Kontakt</h2>
          <p>
            Telefon:{" "}
            <a href="tel:+352621399411" className="text-amber-400 hover:underline">
              +352 621 399 411
            </a>
            <br />
            E-Mail:{" "}
            <a
              href="mailto:teyoorll@gmail.com"
              className="text-amber-400 hover:underline"
            >
              teyoorll@gmail.com
            </a>
            <br />
            Website:{" "}
            <a
              href="https://stella-host.de"
              className="text-amber-400 hover:underline"
            >
              https://stella-host.de
            </a>
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">
            Verantwortlich für den Inhalt
          </h2>
          <p>
            Justin Scheer
            <br />
            (Anschrift wie oben)
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">
            Weitere Angaben
          </h2>
          <p>
            Stella Host wird von einer natürlichen Person betrieben. Soweit keine
            Eintragung in ein Handelsregister und keine Umsatzsteuer-ID vorliegen,
            werden diese Angaben hier nicht gemacht.
          </p>
          <p className="text-zinc-400">
            Bei entgeltlichen Leistungen (z. B. Server gegen Guthaben) kann eine
            Anbieterkennzeichnung mit vollständiger Anschrift und klarer
            Kontaktmöglichkeit erforderlich sein. Maßgeblich sind die Gesetze am
            Sitz des Anbieters sowie die Vorschriften des Ziellandes der Nutzer.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">
            Haftung für Inhalte
          </h2>
          <p>
            Als Anbieter sind wir für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Für fremde Informationen, die
            Nutzer speichern oder übermitteln (z. B. in Tickets oder auf gemieteten
            Servern), gelten die gesetzlichen Regelungen; sobald uns konkrete
            Rechtsverletzungen bekannt werden, entfernen wir entsprechende Inhalte
            bzw. sperren den Zugang, soweit technisch und rechtlich möglich und
            zumutbar.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">Haftung für Links</h2>
          <p>
            Unsere Seiten können Links zu externen Websites Dritter enthalten. Auf
            deren Inhalte haben wir keinen Einfluss. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.
            Bei bekannt werdenden Rechtsverletzungen werden wir derartige Links
            entfernen.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">Urheberrecht</h2>
          <p>
            Die vom Anbieter erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem Urheberrecht. Vervielfältigung, Bearbeitung und
            Verbreitung außerhalb der gesetzlichen Schranken bedürfen der
            schriftlichen Zustimmung des Anbieters.
          </p>
        </section>

        <p className="text-center text-xs text-zinc-600">
          <Link href="/datenschutz" className="text-zinc-500 hover:text-amber-400">
            Datenschutzerklärung
          </Link>
          {" · "}
          <Link href="/" className="text-zinc-500 hover:text-amber-400">
            Startseite
          </Link>
        </p>
      </div>
    </main>
  );
}
