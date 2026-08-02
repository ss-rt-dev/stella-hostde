"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../app/landing.css";

const FAQ = [
  {
    q: "Wie miete ich einen Server?",
    a: "Registriere dich, lade Guthaben per PayPal auf und erstelle im Dashboard einen Server – die Provisionierung über Proxmox läuft automatisch.",
  },
  {
    q: "Welche Zahlungsmittel gibt es?",
    a: "Du lädst Guthaben per PayPal auf. Die Server-Gebühr wird monatsweise vom Guthaben abgebucht.",
  },
  {
    q: "Kann ich meinen Account löschen?",
    a: "Ja. Unter Konto → Gefahrenzone kannst du dein Konto und alle zugehörigen Daten selbst löschen (DSGVO).",
  },
  {
    q: "Gibt es Support?",
    a: "Ja. Im Dashboard unter Support erstellst du Tickets – auch für Team-Bewerbungen.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [impressum, setImpressum] = useState(false);

  useEffect(() => {
    const canvas = document.getElementById("starfield") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: { x: number; y: number; size: number; speed: number }[] = [];
    let raf = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 65; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.15 + 0.05,
      });
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "rgba(255,255,255,0.28)";
      stars.forEach((s) => {
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx!.fill();
        s.y -= s.speed;
        if (s.y < 0) {
          s.y = canvas!.height;
          s.x = Math.random() * canvas!.width;
        }
      });
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="landing-root">
      <canvas id="starfield" />
      <div className="glow-a" />
      <div className="glow-b" />

      <div className="app">
        <header>
          <div className="header-inner">
            <div className="logo">
              Stella <span>Host</span>
            </div>
            <nav className="mainnav">
              <span className="navlink active">Home</span>
              <a href="#vorteile" className="navlink">
                Vorteile
              </a>
              <a href="#faq" className="navlink">
                FAQ
              </a>
              <Link href="/dashboard" className="navlink staff-btn">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <div className="page-inner">
          <section className="hero">
            <div>
              <div className="eyebrow">Hosting-Infrastruktur</div>
              <h1>
                Server, die halten,
                <br />
                was Stella verspricht.
              </h1>
              <p className="lead">
                LXC-Server über Proxmox – Minecraft, Discord-Bots und Debian.
                Transparent, schnell provisioniert, mit Live-Support im Dashboard.
              </p>
              <div className="hero-actions">
                <Link href="/register" className="btn primary">
                  Jetzt starten
                </Link>
                <Link href="/login" className="btn">
                  Anmelden
                </Link>
              </div>
            </div>

            <div className="discord-window">
              <div className="dc-topbar">
                <span className="dc-channel"># live-status</span>
              </div>
              <div className="dc-messages">
                <div className="dc-msg">
                  <div className="dc-avatar">S</div>
                  <div className="dc-body">
                    <div className="dc-headline">
                      <span className="dc-author">Stella-System</span>
                      <span className="dc-apptag">APP</span>
                    </div>
                    <div className="dc-embed-wrap shown">
                      <div className="dc-embed">
                        <div className="dc-embed-accent" />
                        <div className="dc-embed-body">
                          <div className="dc-embed-title">Nodes stabil online</div>
                          <div className="dc-embed-desc">
                            Cluster bereit. Provisionierung und Support aktiv.
                          </div>
                          <div className="dc-stats">
                            <div className="dc-stat">
                              <div className="num">99.9%</div>
                              <div className="lbl">Uptime</div>
                            </div>
                            <div className="dc-stat">
                              <div className="num">&lt;4ms</div>
                              <div className="lbl">Ping</div>
                            </div>
                            <div className="dc-stat">
                              <div className="num">LXC</div>
                              <div className="lbl">Proxmox</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sub-section" id="vorteile">
            <h2>Deine Vorteile</h2>
            <p className="sub-sub">Qualität und Kontrolle im Überblick.</p>
            <div className="info-grid">
              <div className="info-card">
                <h3>Echte Hardware</h3>
                <p>SSD-Storage und moderne CPUs – Ressourcen fest zugewiesen.</p>
              </div>
              <div className="info-card">
                <h3>Dashboard & Console</h3>
                <p>Server starten, stoppen, Dateien und Terminal direkt im Browser.</p>
              </div>
              <div className="info-card">
                <h3>Minecraft & Bots</h3>
                <p>Vorlagen und Setups für Paper, Vanilla und Discord-Bots.</p>
              </div>
              <div className="info-card">
                <h3>Support & Team</h3>
                <p>Tickets und Team-Bewerbungen zentral im Dashboard.</p>
              </div>
            </div>
          </section>

          <section className="sub-section" id="faq">
            <h2 className="text-center">Häufige Fragen</h2>
            <p className="sub-sub text-center">Kurz und klar beantwortet.</p>
            <div className="faq-wrap">
              {FAQ.map((item, i) => (
                <div key={i} className={`faq-item ${openFaq === i ? "open" : ""}`}>
                  <div
                    className="faq-trigger"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <h3>{item.q}</h3>
                    <span>+</span>
                  </div>
                  <div className="faq-content">
                    <div className="faq-content-inner">{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer>
            <div className="footer-inner">
              <span className="footer-brand">© 2026 Stella Host</span>
              <div className="footer-links">
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => setImpressum(true)}
                >
                  Impressum
                </button>
                <span className="footer-sep">·</span>
                <span>Hosting für Communities</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {impressum && (
        <div className="modal-overlay active" onClick={() => setImpressum(false)}>
          <div
            className="modal-box impressum-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Impressum</h3>
            <div className="impressum-body">
              <p>
                <strong>Angaben gemäß § 5 TMG / Art. 3 Abs. 1 E-Commerce-Gesetz</strong>
              </p>
              <p>
                <strong>Diensteanbieter / Betreiber</strong>
                <br />
                Justin Scheer
                <br />
                Stella Host (privates Projekt)
              </p>
              <p>
                <strong>Kontakt</strong>
                <br />
                Telefon: +352 621 399 411
                <br />
                E-Mail:{" "}
                <a href="mailto:teyoorll@gmail.com">teyoorll@gmail.com</a>
                <br />
                Web:{" "}
                <a href="https://stella-host.de" target="_blank" rel="noreferrer">
                  https://stella-host.de
                </a>
              </p>
              <p>
                <strong>Verantwortlich für den Inhalt</strong>
                <br />
                Justin Scheer (Anschrift auf Anfrage per E-Mail)
              </p>
              <p>
                <strong>Hinweis</strong>
                <br />
                Stella Host wird als privates Hobbyprojekt betrieben und ist kein
                gewerbliches Unternehmen im Sinne eines Handelsregisters. Es besteht
                keine Umsatzsteuer-Identifikationsnummer.
              </p>
              <p>
                <strong>Haftung für Inhalte</strong>
                <br />
                Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
                den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
                überwachen. Bei bekannt werdenden Rechtsverletzungen entfernen wir
                entsprechende Inhalte umgehend.
              </p>
              <p>
                <strong>Haftung für Links</strong>
                <br />
                Unser Angebot enthält ggf. Links zu externen Websites Dritter. Auf deren
                Inhalte haben wir keinen Einfluss; für diese ist stets der jeweilige
                Anbieter verantwortlich.
              </p>
              <p>
                <strong>Urheberrecht</strong>
                <br />
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
                Seiten unterliegen dem Urheberrecht. Vervielfältigung und Bearbeitung
                bedürfen der schriftlichen Zustimmung des Betreibers.
              </p>
              <p>
                <strong>Datenschutz</strong>
                <br />
                Personenbezogene Daten werden nur im für den Betrieb notwendigen Umfang
                verarbeitet (z. B. Konto, Server, Support). Du kannst dein Konto und alle
                zugehörigen Daten jederzeit unter Konto → Gefahrenzone selbst löschen.
              </p>
            </div>
            <button
              type="button"
              className="btn primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => setImpressum(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
