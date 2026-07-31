/**
 * SSH zum Proxmox-Host + pct exec im LXC.
 * Env: PROXMOX_SSH_HOST, PROXMOX_SSH_USER, PROXMOX_SSH_PASSWORD
 * (optional PROXMOX_SSH_PORT, PROXMOX_SSH_PRIVATE_KEY)
 * Fallback-Passwort: PROXMOX_PASSWORD
 */

import { Client } from "ssh2";

const MAX_OUT = 2 * 1024 * 1024; // 2 MB

export function hasSshConfig(): boolean {
  return Boolean(process.env.PROXMOX_SSH_HOST?.trim());
}

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, `'"'"'`)}'`;
}

/** Host ohne https:// und ohne Port-Suffix */
function normalizeSshHost(raw: string): string {
  let h = raw.trim();
  h = h.replace(/^https?:\/\//i, "");
  // trailing slash / path entfernen
  h = h.split("/")[0];
  // host:port → host (Port separat)
  if (h.includes(":") && !h.includes("]")) {
    // IPv4 host:port
    const parts = h.split(":");
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      return parts[0];
    }
  }
  return h;
}

/** Sichere absolute Pfade – kein .., kein leerer Pfad */
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

export function runSsh(
  command: string,
  timeoutMs = 45000
): Promise<{ ok: boolean; out: string; code: number }> {
  const hostRaw = process.env.PROXMOX_SSH_HOST?.trim() || "";
  const host = normalizeSshHost(hostRaw);
  const user = process.env.PROXMOX_SSH_USER?.trim() || "root";
  // Passwort: SSH-spezifisch, sonst Proxmox-Root-Passwort
  const password =
    process.env.PROXMOX_SSH_PASSWORD ||
    process.env.PROXMOX_PASSWORD ||
    "";
  const privateKey = (process.env.PROXMOX_SSH_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  );
  const port = Number(process.env.PROXMOX_SSH_PORT || 22);

  if (!host) {
    return Promise.resolve({
      ok: false,
      out: "PROXMOX_SSH_HOST ist nicht gesetzt",
      code: -1,
    });
  }

  if (!password && !privateKey) {
    return Promise.resolve({
      ok: false,
      out: "Weder PROXMOX_SSH_PASSWORD noch PROXMOX_SSH_PRIVATE_KEY gesetzt",
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
      finish({ ok: false, out: "SSH Timeout", code: -1 });
    }, timeoutMs);

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
      // Viele Server (Debian/Proxmox) wollen keyboard-interactive statt "password"
      .on("keyboard-interactive", (_name, _instructions, _lang, prompts, finishKb) => {
        const answers = prompts.map(() => password);
        finishKb(answers);
      })
      .on("error", (err) => {
        clearTimeout(timer);
        finish({ ok: false, out: err.message, code: -1 });
      })
      .connect({
        host,
        port,
        username: user,
        password: password || undefined,
        privateKey: privateKey || undefined,
        tryKeyboard: true,
        readyTimeout: 20000,
        // Host-Key-Prüfung für Serverless überspringen (wie StrictHostKeyChecking=no)
        hostVerifier: () => true,
      });
  });
}

/** Befehl im LXC ausführen */
export async function pctExec(
  vmid: number,
  innerCmd: string,
  timeoutMs = 45000
): Promise<{ ok: boolean; out: string; code: number }> {
  const remote = `pct exec ${vmid} -- bash -c ${shellEscape(innerCmd)}`;
  return runSsh(remote, timeoutMs);
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
import os, json, stat, sys
path = ${JSON.stringify(p)}
if not os.path.isdir(path):
    print(json.dumps({"error": "not a directory"}))
    sys.exit(2)
entries = []
try:
    names = sorted(os.listdir(path), key=lambda n: (not os.path.isdir(os.path.join(path, n)), n.lower()))
except PermissionError as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(3)
for name in names:
    full = os.path.join(path, name)
    try:
        st = os.lstat(full)
        if stat.S_ISDIR(st.st_mode):
            t = "dir"
        elif stat.S_ISLNK(st.st_mode):
            t = "link"
        elif stat.S_ISREG(st.st_mode):
            t = "file"
        else:
            t = "other"
        entries.append({"name": name, "type": t, "size": st.st_size, "mtime": int(st.st_mtime)})
    except OSError:
        entries.append({"name": name, "type": "other", "size": 0, "mtime": 0})
print(json.dumps(entries))
`.trim();

  const b64 = Buffer.from(script, "utf8").toString("base64");
  const r = await pctExec(vmid, `echo ${b64} | base64 -d | python3`);
  if (!r.ok) {
    throw new Error(r.out.trim() || "Verzeichnis konnte nicht gelesen werden");
  }
  const raw = r.out.trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.error) throw new Error(parsed.error);
    if (!Array.isArray(parsed)) throw new Error("Ungültige Antwort");
    return parsed as FileEntry[];
  } catch (e: any) {
    if (e.message && !e.message.includes("JSON")) throw e;
    throw new Error("Parse-Fehler: " + raw.slice(0, 200));
  }
}

export async function readFile(
  vmid: number,
  path: string,
  maxBytes = 512 * 1024
): Promise<{ content: string; size: number; truncated: boolean }> {
  const p = sanitizePath(path);
  const script = `
import os, json, sys
path = ${JSON.stringify(p)}
max_b = ${maxBytes}
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
`.trim();

  const b64 = Buffer.from(script, "utf8").toString("base64");
  const r = await pctExec(vmid, `echo ${b64} | base64 -d | python3`);
  if (!r.ok) throw new Error(r.out.trim() || "Datei konnte nicht gelesen werden");
  const parsed = JSON.parse(r.out.trim());
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

export async function writeFile(
  vmid: number,
  path: string,
  content: string
): Promise<void> {
  const p = sanitizePath(path);
  if (p === "/") throw new Error("Root kann nicht überschrieben werden");
  const contentB64 = Buffer.from(content, "utf8").toString("base64");
  if (contentB64.length > 1_500_000) {
    throw new Error("Datei zu groß (max. ~1 MB)");
  }
  const dir = p.substring(0, p.lastIndexOf("/")) || "/";
  const cmd = `mkdir -p ${shellEscape(dir)} && echo ${shellEscape(contentB64)} | base64 -d > ${shellEscape(p)}`;
  const r = await pctExec(vmid, cmd);
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
  if (p === "/" || p === "/root" || p === "/etc" || p === "/bin" || p === "/usr") {
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
