/**
 * SSH zum Proxmox-Host + pct exec im LXC (Dateimanager).
 *
 * Vercel Env (mindestens):
 *   PROXMOX_SSH_HOST=176.9.164.43
 *   PROXMOX_SSH_USER=root
 *   PROXMOX_SSH_PASSWORD=dein-root-passwort
 *
 * Oder Key (eine Zeile Base64):
 *   PROXMOX_SSH_PRIVATE_KEY=...
 *
 * Port 22 muss von außen erreichbar sein (Firewall).
 */

import type { ConnectConfig } from "ssh2";

const MAX_OUT = 2 * 1024 * 1024;

export function hasSshConfig(): boolean {
  const host = process.env.PROXMOX_SSH_HOST?.trim();
  const password =
    process.env.PROXMOX_SSH_PASSWORD?.trim() ||
    process.env.PROXMOX_PASSWORD?.trim();
  const key = process.env.PROXMOX_SSH_PRIVATE_KEY?.trim();
  return Boolean(host && (password || key));
}

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, `'"'"'`)}'`;
}

function normalizeSshHost(raw: string): string {
  let h = raw.trim();
  h = h.replace(/^https?:\/\//i, "");
  h = h.split("/")[0] || h;
  if (h.includes(":") && !h.startsWith("[")) {
    const parts = h.split(":");
    if (parts.length === 2 && /^\d+$/.test(parts[1]!)) return parts[0]!;
  }
  return h;
}

function normalizePrivateKey(raw: string): string {
  if (!raw) return "";
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1);
  }
  if (k.includes("\\n")) k = k.replace(/\\n/g, "\n");
  k = k.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (k.includes("BEGIN") && k.includes("PRIVATE KEY")) {
    return k.endsWith("\n") ? k : k + "\n";
  }

  const compact = k.replace(/\s+/g, "");
  if (compact.length > 80 && /^[A-Za-z0-9+/=]+$/.test(compact)) {
    try {
      const decoded = Buffer.from(compact, "base64").toString("utf8").trim();
      if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) {
        return decoded.endsWith("\n") ? decoded : decoded + "\n";
      }
    } catch {
      /* ignore */
    }
  }
  return k;
}

export function sanitizePath(raw: string): string {
  let p = (raw || "/").replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  const parts = p.split("/").filter((seg) => seg && seg !== ".");
  const out: string[] = [];
  for (const seg of parts) {
    if (seg === "..") {
      if (out.length) out.pop();
      continue;
    }
    if (/[\0]/.test(seg)) throw new Error("Ungültiger Pfad");
    out.push(seg);
  }
  return "/" + out.join("/") || "/";
}

function loadSsh2(): typeof import("ssh2") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("ssh2") as typeof import("ssh2");
}

export function runSsh(
  command: string,
  timeoutMs = 45000
): Promise<{ ok: boolean; out: string; code: number }> {
  const host = normalizeSshHost(process.env.PROXMOX_SSH_HOST?.trim() || "");
  const user = process.env.PROXMOX_SSH_USER?.trim() || "root";
  const password =
    process.env.PROXMOX_SSH_PASSWORD?.trim() ||
    process.env.PROXMOX_PASSWORD?.trim() ||
    "";
  const keyStr = normalizePrivateKey(process.env.PROXMOX_SSH_PRIVATE_KEY || "");
  const port = Number(process.env.PROXMOX_SSH_PORT || 22);

  if (!host) {
    return Promise.resolve({
      ok: false,
      out: "PROXMOX_SSH_HOST fehlt in Vercel",
      code: -1,
    });
  }
  if (!password && !keyStr) {
    return Promise.resolve({
      ok: false,
      out: "PROXMOX_SSH_PASSWORD oder PROXMOX_SSH_PRIVATE_KEY in Vercel setzen",
      code: -1,
    });
  }
  if (keyStr && (!keyStr.includes("BEGIN") || !keyStr.includes("PRIVATE KEY"))) {
    return Promise.resolve({
      ok: false,
      out: "PROXMOX_SSH_PRIVATE_KEY ungültig (kein BEGIN PRIVATE KEY). Besser: PROXMOX_SSH_PASSWORD nutzen.",
      code: -1,
    });
  }

  let Client: typeof import("ssh2").Client;
  try {
    Client = loadSsh2().Client;
  } catch (e: any) {
    return Promise.resolve({
      ok: false,
      out: `ssh2-Modul nicht geladen: ${e.message}. Redeploy nach npm install ssh2.`,
      code: -1,
    });
  }

  return new Promise((resolve) => {
    const conn = new Client();
    let settled = false;
    const finish = (result: { ok: boolean; out: string; code: number }) => {
      if (settled) return;
      settled = true;
      try {
        conn.end();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        out: `SSH Timeout (${timeoutMs / 1000}s) – Host ${host}:${port} nicht erreichbar (Firewall Port 22?).`,
        code: -1,
      });
    }, timeoutMs);

    const connectOpts: ConnectConfig = {
      host,
      port,
      username: user,
      readyTimeout: 20000,
      agent: undefined,
      tryKeyboard: Boolean(password && !keyStr),
      hostVerifier: () => true,
      algorithms: {
        serverHostKey: [
          "ssh-ed25519",
          "ecdsa-sha2-nistp256",
          "ecdsa-sha2-nistp384",
          "ecdsa-sha2-nistp521",
          "rsa-sha2-512",
          "rsa-sha2-256",
          "ssh-rsa",
        ],
      },
    };

    if (keyStr) {
      connectOpts.privateKey = Buffer.from(keyStr, "utf8");
    } else {
      connectOpts.password = password;
    }

    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            finish({ ok: false, out: err.message, code: -1 });
            return;
          }
          let out = "";
          stream.on("data", (d: Buffer) => {
            if (out.length < MAX_OUT) out += d.toString("utf8");
          });
          stream.stderr?.on("data", (d: Buffer) => {
            if (out.length < MAX_OUT) out += d.toString("utf8");
          });
          stream.on("close", (code: number) => {
            clearTimeout(timer);
            finish({
              ok: code === 0,
              out: out.slice(0, MAX_OUT),
              code: code ?? -1,
            });
          });
        });
      })
      .on("keyboard-interactive", (_n, _i, _l, prompts, finishKb) => {
        finishKb(prompts.map(() => password));
      })
      .on("error", (err) => {
        clearTimeout(timer);
        let msg = err.message || String(err);
        if (/ENOENT|spawn.*ssh/i.test(msg)) {
          msg =
            "SSH-Fehler (spawn ENOENT). Auf Vercel darf kein System-ssh genutzt werden. " +
            "Bitte PROXMOX_SSH_PASSWORD setzen (einfacher als Key) und Redeploy. " +
            "Original: " +
            msg;
        } else if (/ECONNREFUSED|ETIMEDOUT|ENETUNREACH/i.test(msg)) {
          msg = `Keine Verbindung zu ${host}:${port} – Firewall/SSH-Dienst prüfen. (${msg})`;
        } else if (/authentication methods failed|All configured authentication methods failed/i.test(msg)) {
          msg =
            "SSH-Login abgelehnt – User/Passwort (PROXMOX_SSH_PASSWORD) oder Key prüfen.";
        }
        finish({ ok: false, out: msg, code: -1 });
      })
      .connect(connectOpts);
  });
}

export async function pctExec(
  vmid: number,
  innerCmd: string,
  timeoutMs = 45000
): Promise<{ ok: boolean; out: string; code: number }> {
  const wrapped = `pct exec ${vmid} -- bash -lc ${shellEscape(innerCmd)}`;
  return runSsh(wrapped, timeoutMs);
}

export type FileEntry = {
  name: string;
  type: "dir" | "file" | "link" | "other";
  size: number;
  mtime: number;
};

export async function listDir(vmid: number, path: string): Promise<FileEntry[]> {
  const p = sanitizePath(path);
  const script = `
set -e
P=${shellEscape(p)}
if [ ! -d "$P" ]; then echo '{"error":"not a directory"}'; exit 2; fi
python3 - "$P" <<'PY'
import os, json, stat, sys
path = sys.argv[1]
entries = []
try:
    names = sorted(os.listdir(path), key=lambda n: (not os.path.isdir(os.path.join(path, n)), n.lower()))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(3)
for name in names:
    full = os.path.join(path, name)
    try:
        st = os.lstat(full)
        if stat.S_ISDIR(st.st_mode): t = "dir"
        elif stat.S_ISLNK(st.st_mode): t = "link"
        elif stat.S_ISREG(st.st_mode): t = "file"
        else: t = "other"
        entries.append({"name": name, "type": t, "size": st.st_size, "mtime": int(st.st_mtime)})
    except OSError:
        entries.append({"name": name, "type": "other", "size": 0, "mtime": 0})
print(json.dumps(entries))
PY
`.trim();
  const r = await pctExec(vmid, script);
  if (!r.ok) {
    throw new Error(
      r.out.trim() ||
        "Verzeichnis konnte nicht gelesen werden (pct exec / SSH)"
    );
  }
  const raw = r.out.trim();
  const jsonStart =
    raw.indexOf("[") >= 0 &&
    (raw.indexOf("{") < 0 || raw.indexOf("[") < raw.indexOf("{"))
      ? raw.indexOf("[")
      : raw.indexOf("{");
  const slice = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
  try {
    const parsed = JSON.parse(slice);
    if (parsed?.error) throw new Error(parsed.error);
    if (!Array.isArray(parsed)) throw new Error("Ungültige Antwort");
    return parsed as FileEntry[];
  } catch (e: any) {
    if (e.message && !/JSON|Unexpected/.test(e.message)) throw e;
    throw new Error("Parse-Fehler: " + raw.slice(0, 300));
  }
}

export async function readFile(
  vmid: number,
  path: string,
  maxBytes = 512 * 1024
): Promise<{ content: string; size: number; truncated: boolean }> {
  const p = sanitizePath(path);
  const script = `
python3 - ${shellEscape(p)} ${maxBytes} <<'PY'
import os, json, sys
path = sys.argv[1]
max_b = int(sys.argv[2])
if not os.path.isfile(path):
    print(json.dumps({"error": "not a file"}))
    sys.exit(2)
size = os.path.getsize(path)
with open(path, "rb") as f:
    data = f.read(max_b + 1)
truncated = len(data) > max_b
data = data[:max_b]
try:
    text = data.decode("utf-8")
except Exception:
    text = data.decode("latin-1", errors="replace")
print(json.dumps({"content": text, "size": size, "truncated": truncated}))
PY
`.trim();
  const r = await pctExec(vmid, script);
  if (!r.ok) throw new Error(r.out.trim() || "Datei konnte nicht gelesen werden");
  const raw = r.out.trim();
  const i = raw.indexOf("{");
  const parsed = JSON.parse(i >= 0 ? raw.slice(i) : raw);
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

export async function writeFile(
  vmid: number,
  path: string,
  content: string
): Promise<void> {
  const contentB64 = Buffer.from(content, "utf8").toString("base64");
  await writeFileBase64(vmid, path, contentB64);
}

/** Binär/Text-Upload als Base64 (max. ~1 MB roh). */
export async function writeFileBase64(
  vmid: number,
  path: string,
  contentB64: string
): Promise<void> {
  const p = sanitizePath(path);
  if (p === "/") throw new Error("Root kann nicht überschrieben werden");
  const clean = contentB64.replace(/\s+/g, "");
  if (clean.length > 1_500_000) throw new Error("Datei zu groß (max. ~1 MB)");
  const dir = p.substring(0, p.lastIndexOf("/")) || "/";
  const cmd = `mkdir -p ${shellEscape(dir)} && echo ${shellEscape(clean)} | base64 -d > ${shellEscape(p)}`;
  const r = await pctExec(vmid, cmd, 90000);
  if (!r.ok) throw new Error(r.out.trim() || "Schreiben fehlgeschlagen");
}

export async function mkdir(vmid: number, path: string): Promise<void> {
  const p = sanitizePath(path);
  if (p === "/") throw new Error("Ungültiger Pfad");
  const r = await pctExec(vmid, `mkdir -p ${shellEscape(p)}`);
  if (!r.ok) throw new Error(r.out.trim() || "Ordner erstellen fehlgeschlagen");
}

export async function removePath(vmid: number, path: string): Promise<void> {
  const p = sanitizePath(path);
  if (["/", "/root", "/etc", "/bin", "/usr", "/var", "/home"].includes(p)) {
    throw new Error("Dieser Pfad darf nicht gelöscht werden");
  }
  const r = await pctExec(vmid, `rm -rf ${shellEscape(p)}`);
  if (!r.ok) throw new Error(r.out.trim() || "Löschen fehlgeschlagen");
}

export async function renamePath(
  vmid: number,
  from: string,
  to: string
): Promise<void> {
  const a = sanitizePath(from);
  const b = sanitizePath(to);
  if (a === "/" || b === "/") throw new Error("Ungültiger Pfad");
  const r = await pctExec(vmid, `mv ${shellEscape(a)} ${shellEscape(b)}`);
  if (!r.ok) throw new Error(r.out.trim() || "Umbenennen fehlgeschlagen");
}

export async function testSsh(): Promise<{ ok: boolean; message: string }> {
  const r = await runSsh("echo stella-ssh-ok && hostname && which pct || true", 20000);
  if (!r.ok) return { ok: false, message: r.out.trim() || "SSH fehlgeschlagen" };
  return { ok: true, message: r.out.trim() };
}
