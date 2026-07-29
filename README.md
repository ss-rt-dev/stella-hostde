# Stella Host Dashboard

Kunden-Dashboard zum automatischen Mieten von LXC-Containern über Proxmox.
Guthaben-System mit PayPal, stündliche Abrechnung, Admin-Bereich.

**Stack:** Next.js 15 · Prisma · PostgreSQL · NextAuth · PayPal · Proxmox API  
**Deploy:** Vercel

---

## Features

- Kunden-Registrierung / Login
- Guthaben per PayPal aufladen
- LXC-Container aus Templates erstellen (automatisch)
- Start / Stop / Löschen
- Stündliche Abrechnung + Auto-Stop bei 0 €
- Admin-Übersicht (Kunden, Server, Pakete)
- Landingpage unter `/`
- Dashboard unter `/dashboard`

---

## Setup

```bash
npm install
npx prisma db push
npm run dev
```

Env-Vars in Vercel setzen (nicht im Repo committen):
`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, PayPal, Proxmox.

---

## Vercel

Framework: **Next.js**  
Build: `prisma generate && next build`
