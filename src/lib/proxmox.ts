/**
 * Proxmox API Client für LXC-Container
 * Env: PROXMOX_HOST, PROXMOX_TOKEN_ID, PROXMOX_TOKEN_SECRET
 * Optional: PROXMOX_INSECURE, PROXMOX_NODE, PROXMOX_STORAGE
 */

import https from "https";
import { URL } from "url";

const PROXMOX_HOST = (process.env.PROXMOX_HOST || "").replace(/\/$/, "");
const TOKEN_ID = process.env.PROXMOX_TOKEN_ID || "";
const TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET || "";
const INSECURE =
  process.env.PROXMOX_INSECURE === "true" ||
  process.env.PROXMOX_INSECURE === "1";

function assertConfig() {
  if (!PROXMOX_HOST) {
    throw new Error(
      "PROXMOX_HOST fehlt in den Environment Variables (z.B. https://dein-host:8006)"
    );
  }
  if (!TOKEN_ID || !TOKEN_SECRET) {
    throw new Error(
      "PROXMOX_TOKEN_ID oder PROXMOX_TOKEN_SECRET fehlt in den Environment Variables"
    );
  }
}

export function getProxmoxHost() {
  return PROXMOX_HOST;
}

function proxmoxRequest(
  path: string,
  options: {
    method?: string;
    body?: string;
    contentType?: string;
  } = {}
): Promise<any> {
  assertConfig();

  const method = options.method || "GET";
  const full = `${PROXMOX_HOST}/api2/json${path}`;
  const u = new URL(full);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 8006,
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: `PVEAPIToken=${TOKEN_ID}=${TOKEN_SECRET}`,
          "Content-Type": options.contentType || "application/json",
          ...(options.body
            ? { "Content-Length": Buffer.byteLength(options.body) }
            : {}),
        },
        rejectUnauthorized: !INSECURE,
        timeout: 55000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(`Proxmox API ${res.statusCode}: ${text.slice(0, 500)}`)
            );
            return;
          }
          try {
            const json = JSON.parse(text);
            resolve(json.data !== undefined ? json.data : json);
          } catch {
            reject(new Error(`Ungültige Proxmox-Antwort: ${text.slice(0, 200)}`));
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(
        new Error(
          `Proxmox nicht erreichbar (${u.hostname}): ${err.message}. ` +
            `Prüfe PROXMOX_HOST, Firewall und PROXMOX_INSECURE=true bei SSL-Fehlern.`
        )
      );
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Proxmox Timeout (55s)"));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

export async function listNodes(): Promise<{ node: string; status: string }[]> {
  const data = await proxmoxRequest("/nodes");
  if (!Array.isArray(data)) return [];
  return data.map((n: any) => ({
    node: String(n.node),
    status: String(n.status || ""),
  }));
}

export async function resolveNode(preferred?: string | null): Promise<string> {
  const fromEnv = process.env.PROXMOX_NODE?.trim();
  if (fromEnv) return fromEnv;

  const nodes = await listNodes();
  if (!nodes.length) {
    throw new Error("Keine Proxmox-Nodes gefunden.");
  }

  if (preferred && preferred !== "pve") {
    const match = nodes.find((n) => n.node === preferred);
    if (match) return match.node;
  }

  const online = nodes.find((n) => n.status === "online") || nodes[0];
  return online.node;
}

/** Storage mit rootdir (LXC-Disks) finden */
export async function resolveStorage(
  node: string,
  preferred?: string | null
): Promise<string> {
  const fromEnv = process.env.PROXMOX_STORAGE?.trim();
  if (fromEnv) return fromEnv;

  const data = await proxmoxRequest(`/nodes/${node}/storage`);
  if (!Array.isArray(data) || !data.length) {
    throw new Error("Kein Storage auf dem Node gefunden.");
  }

  const active = data.filter((s: any) => s.enabled !== 0 && s.active !== 0);

  if (preferred && preferred !== "local-lvm") {
    const match = active.find((s: any) => s.storage === preferred);
    if (match) return String(match.storage);
  }

  // Bevorzugt Storage mit rootdir (Container-Disks)
  const withRoot =
    active.find((s: any) => String(s.content || "").includes("rootdir")) ||
    active.find((s: any) => String(s.content || "").includes("images")) ||
    active[0];

  if (!withRoot) {
    throw new Error(
      `Kein nutzbares Storage. Verfügbar: ${data.map((s: any) => s.storage).join(", ")}`
    );
  }

  return String(withRoot.storage);
}

export async function getNextVmid(): Promise<number> {
  const data = await proxmoxRequest("/cluster/nextid");
  return Number(data);
}

export interface CreateLxcOptions {
  vmid: number;
  hostname: string;
  password: string;
  cores: number;
  memory: number;
  disk: string;
  ostemplate: string;
  node: string;
  net0?: string;
}

export async function createLxc(opts: CreateLxcOptions) {
  const body = new URLSearchParams();
  body.set("vmid", String(opts.vmid));
  body.set("hostname", opts.hostname);
  body.set("password", opts.password);
  body.set("cores", String(opts.cores));
  body.set("memory", String(opts.memory));
  body.set("rootfs", opts.disk);
  body.set("ostemplate", opts.ostemplate);
  body.set("net0", opts.net0 || "name=eth0,bridge=vmbr0,ip=dhcp");
  body.set("start", "1");
  body.set("unprivileged", "1");

  return proxmoxRequest(`/nodes/${opts.node}/lxc`, {
    method: "POST",
    body: body.toString(),
    contentType: "application/x-www-form-urlencoded",
  });
}

export async function startLxc(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/status/start`, {
    method: "POST",
  });
}

export async function stopLxc(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/status/stop`, {
    method: "POST",
  });
}

export async function deleteLxc(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}`, {
    method: "DELETE",
  });
}

export async function getLxcStatus(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/status/current`);
}

export async function getLxcConfig(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/config`);
}

/** Terminal-Proxy Ticket für xterm.js Console */
export async function createTermProxy(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/termproxy`, {
    method: "POST",
  });
}

/** VNC/Term WebSocket-URL (Browser verbindet direkt zu Proxmox) */
export function buildTermWebsocketUrl(
  node: string,
  vmid: number,
  port: string | number,
  ticket: string
) {
  const u = new URL(PROXMOX_HOST);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  const ticketEnc = encodeURIComponent(ticket);
  return `${proto}//${u.host}/api2/json/nodes/${node}/lxc/${vmid}/vncwebsocket?port=${port}&vncticket=${ticketEnc}`;
}
