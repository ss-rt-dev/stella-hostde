# Proxmox LXC Dashboard

Kunden-Dashboard zum automatischen Mieten von LXC-Containern über Proxmox.
Guthaben-System mit PayPal, stündliche Abrechnung, Admin-Bereich.

**Stack:** Next.js 15 · Prisma · PostgreSQL · NextAuth · PayPal · Proxmox API  
**Deploy:** Vercel (unter `/dashboard`)

---

## Features

- Kunden-Registrierung / Login
- Guthaben per PayPal aufladen
- LXC-Container aus Templates erstellen (automatisch)
- Start / Stop / Löschen
- Stündliche Abrechnung + Auto-Stop bei 0 €
- Admin-Übersicht (Kunden, Server, Pakete)

---

## Setup

### 1. Abhängigkeiten

```bash
npm install
```

### 2. Umgebungsvariablen

```bash
cp .env.example .env
```

Fülle alle Werte aus (siehe Tabelle unten).

### 3. Datenbank

```bash
npx prisma db push
```

Optional Seed (Beispiel-Pakete + Admin):

```bash
npx tsx prisma/seed.ts
```

### 4. Entwickeln

```bash
npm run dev
```

Öffne http://localhost:3000

---

## Wichtige Env-Vars

| Variable | Beschreibung |
|----------|--------------|
| `DATABASE_URL` | PostgreSQL Connection String (Neon empfohlen) |
| `NEXTAUTH_URL` | Deine Domain (z.B. https://deinedomain.de) |
| `NEXTAUTH_SECRET` | Zufälliger String (`openssl rand -base64 32`) |
| `PROXMOX_HOST` | z.B. `https://pve.example.com:8006` |
| `PROXMOX_TOKEN_ID` | `user@pam!tokenname` |
| `PROXMOX_TOKEN_SECRET` | Token-Secret |
| `PAYPAL_CLIENT_ID` / `SECRET` | Aus dem PayPal Developer Dashboard |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Gleicher Client-ID (öffentlich) |
| `CRON_SECRET` | Beliebiges Geheimnis für den Cron-Endpoint |

---

## Proxmox vorbereiten

1. API-Token anlegen (Datacenter → Permissions → API Tokens)
2. Rechte: mindestens `VM.Allocate`, `VM.Clone`, `VM.Config.*`, `VM.PowerMgmt`, `Datastore.AllocateSpace`
3. Ein LXC-Template bereithalten (z.B. Ubuntu 22.04)
4. In der DB ein Package anlegen mit korrektem `proxmoxTemplateId`, z.B.:

```
local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst
```

---

## Admin-User anlegen

Nach der Registrierung in der DB:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'deine@email.de';
```

Oder im Seed-Script.

---

## Vercel Deploy

1. Repo zu Vercel verbinden
2. Alle Env-Vars eintragen
3. `DATABASE_URL` von Neon/Supabase
4. Domain zuweisen → Dashboard erreichbar unter `/dashboard`

Cron läuft stündlich automatisch (`vercel.json`).

---

## Hinweise

- Das Root-Passwort wird **nur einmal** beim Erstellen angezeigt.
- Bei 0 € Guthaben wird der Container gestoppt (nicht gelöscht).
- Für Produktion: Proxmox mit gültigem Zertifikat nutzen.
- PayPal Capture läuft nach Approve im Frontend.

Viel Erfolg!
