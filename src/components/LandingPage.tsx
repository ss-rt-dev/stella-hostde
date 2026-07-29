"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../app/landing.css";

const FAQ = [
  {
    q: "Sind die Dienste wirklich komplett kostenlos?",
    a: "Ja! Unser Hosting für Minecraft, Webspace und Discord-Bots ist zu 100% kostenfrei. Es gibt keine versteckten Gebühren oder Abo-Fallen.",
  },
  {
    q: "Muss ich Zahlungsdaten hinterlegen?",
    a: "Nein, da unsere Dienste (mit Ausnahme der Premium KVM-Server) kostenlos sind, musst du bei der Registrierung keine Bank- oder Kreditkartendaten angeben.",
  },
  {
    q: "Gibt es versteckte Vertragslaufzeiten?",
    a: "Nein, bei Stella Host setzen wir auf absolute Transparenz. Kostenlose Server kannst du jederzeit über unser Support-System wieder beenden.",
  },
  {
    q: "Wie miete ich einen Server im Dashboard?",
    a: "Registriere dich, lade Guthaben per PayPal auf und erstelle im Dashboard einen LXC-Container – die Provisionierung über Proxmox läuft automatisch.",
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
      ctx!.fillStyle = "rgba(255,255,255,0.35)";
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
    <div className="landing-root" style={{ minHeight: "100vh", background: "#060607", color: "#f6f6f4" }}>
      <canvas id="starfield" />
      <div className="glow-a" />
      <div className="glow-b" />

      <div className="app">
        <header>
          <div className="logo">STELLA HOST</div>
          <nav className="mainnav">
            <span className="navlink active">Home</span>
            <a href="#vorteile" className="navlink">
              Vorteile
            </a>
            <a href="#faq" className="navlink">
              FAQ
            </a>
            <Link href="/dashboard" className="navlink staff-btn">
              ⚡ Dashboard
            </Link>
          </nav>
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow">Hosting-Infrastruktur</div>
            <h1>
              Server, die halten,
              <br />
              was Stella verspricht.
            </h1>
            <p className="lead">
              Kostenloses Minecraft-, Bot- und Webspace-Hosting auf echter Hardware.
              Ohne versteckte Kosten, im Live-DDoS-Schutzverbund.
            </p>
            <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/register" className="btn primary">
                Kostenlos starten →
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
                        <div className="dc-embed-title">Alle Free-Nodes stabil online</div>
                        <div className="dc-embed-desc">
                          Cluster Uptime beträgt aktuell 99.98%. All System Ready.
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
                            <div className="num">6s</div>
                            <div className="lbl">Setup</div>
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
          <h2>Deine Vorteile bei uns</h2>
          <p className="sub-sub">Unsere Qualitätsmerkmale im Überblick.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>Echte Hardware, Gratis</h3>
              <p>
                Enterprise SSDs und moderne Prozessoren. Kostenlos heißt bei uns nicht langsam.
              </p>
            </div>
            <div className="info-card">
              <h3>Kein Overselling</h3>
              <p>Ressourcen werden fest zugewiesen – auch bei Volllast flüssig.</p>
            </div>
            <div className="info-card">
              <h3>Permanent DDoS-Schutz</h3>
              <p>Filterbasierter Schutz, bevor Traffic deinen Server erreicht.</p>
            </div>
            <div className="info-card">
              <h3>Dashboard & Proxmox</h3>
              <p>LXC-Container automatisch provisionieren, Guthaben per PayPal aufladen.</p>
            </div>
          </div>
        </section>

        <section className="sub-section" id="faq" style={{ paddingBottom: "12vh" }}>
          <h2 style={{ textAlign: "center", marginBottom: 10 }}>Häufig gestellte Fragen</h2>
          <p className="sub-sub" style={{ textAlign: "center" }}>
            Alles, was du vor dem Start wissen musst.
          </p>
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
          <span>© 2026 Stella Host</span>
          <span style={{ display: "flex", gap: 15, alignItems: "center" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setImpressum(true);
              }}
              style={{ color: "var(--f)", textDecoration: "none" }}
            >
              Impressum
            </a>
            <span>Made for communities</span>
          </span>
        </footer>
      </div>

      {impressum && (
        <div className="modal-overlay active" onClick={() => setImpressum(false)}>
          <div className="modal-box" style={{ textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: "1.4rem", marginBottom: 15 }}>
              Impressum
            </h3>
            <p style={{ color: "var(--d)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              <strong>Betreiber:</strong> Justin Scheer
              <br />
              Telefon: +352 621 399 411
              <br />
              E-Mail: teyoorll@gmail.com
              <br />
              <br />
              Stella Host wird als privates Hobbyprojekt betrieben und ist kein gewerbliches
              Unternehmen.
            </p>
            <button className="btn primary" style={{ width: "100%", marginTop: 15 }} onClick={() => setImpressum(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
