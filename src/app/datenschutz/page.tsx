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
          <Link href="/" className="text-sm text-zinc-500 hover:text-amber-400">
            Zurueck zur Startseite
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Datenschutz</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informationen zur Verarbeitung personenbezogener Daten (DSGVO)
          </p>
        </div>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">1. Verantwortlicher</h2>
          <p>
            Justin Scheer, Stella Host
            <br />
            E-Mail: teyoorll@gmail.com
            <br />
            Telefon: +352 621 399 411
            <br />
            Anschrift: laut Impressum
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">2. Welche Daten wir verarbeiten</h2>
          <ul className="list-disc space-y-1 pl-5 text-zinc-300">
            <li>Kontodaten: E-Mail, Name, Passwort-Hash, Rolle</li>
            <li>Zahlungsbezogene Daten: Guthaben, Transaktionen (PayPal-Bezug)</li>
            <li>Serverdaten: Hostname, Konfiguration, Status</li>
            <li>Support: Ticketinhalte, Discord-Name bei Team-Bewerbung</li>
            <li>Technische Logs: Login-Zeitpunkte, Aktivitaeten im Panel</li>
          </ul>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">3. Zwecke und Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung erfolgt zur Bereitstellung des Hosting-Angebots und des
            Dashboards, zur Abwicklung von Guthaben und Support sowie zur Sicherheit
            des Systems. Rechtsgrundlagen koennen Vertragserfuellung und berechtigte
            Interessen am sicheren Betrieb sein (Art. 6 Abs. 1 DSGVO).
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">4. Speicherdauer</h2>
          <p>
            Kontodaten werden gespeichert, solange das Konto besteht. Nach Loeschung
            des Kontos entfernen wir die zugehoerigen personenbezogenen Daten, soweit
            keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">5. Empfaenger</h2>
          <p>
            Je nach Betrieb koennen Hosting-, Datenbank- und Zahlungsdienstleister
            (z. B. Vercel, Datenbank-Anbieter, PayPal) Daten in unserem Auftrag
            verarbeiten. Eine Weitergabe zu Werbezwecken an Dritte findet nicht statt.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">6. Deine Rechte</h2>
          <p>
            Du hast unter den gesetzlichen Voraussetzungen Rechte auf Auskunft,
            Berichtigung, Loeschung, Einschraenkung der Verarbeitung, Datenuebertragbarkeit
            und Widerspruch. Beschwerden kannst du bei einer Aufsichtsbehoerde einreichen.
          </p>
          <p>
            Konto und zugehoerige Daten kannst du im Dashboard unter Konto / Gefahrenzone
            selbst loeschen.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-[#121214] p-5 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-white">7. Cookies und Login</h2>
          <p>
            Fuer die Anmeldung werden technisch notwendige Session-Cookies bzw.
            Session-Token verwendet. Ohne sie ist das Dashboard nicht nutzbar.
          </p>
        </section>

        <p className="text-center text-xs text-zinc-600">
          <Link href="/impressum" className="text-zinc-500 hover:text-amber-400">
            Impressum
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
