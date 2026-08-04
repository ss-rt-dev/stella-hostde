/**
 * Proxmox API Client für LXC-Container
 * Env: PROXMOX_HOST, PROXMOX_TOKEN_ID, PROXMOX_TOKEN_SECRET
 * Optional: PROXMOX_INSECURE, PROXMOX_NODE, PROXMOX_STORAGE
 * Optional für Console: PROXMOX_USER + PROXMOX_PASSWORD (Ticket-Auth, zuverlässiger als API-Token)
 * Minecraft-Template: PROXMOX_MINECRAFT_TEMPLATE_VMID oder PROXMOX_TEMPLATE_MINECRAFT
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
    extraHeaders?: Record<string, string>;
    cookie?: string;
  } = {}
): Promise<any> {
  assertConfig();

  const method = (options.method || "GET").toUpperCase();
  const full = `${PROXMOX_HOST}/api2/json${path}`;
  const u = new URL(full);

  const headers: Record<string, string> = {
    ...(options.extraHeaders || {}),
  };

  if (options.cookie) {
    headers["Cookie"] = options.cookie;
  } else {
    headers["Authorization"] = `PVEAPIToken=${TOKEN_ID}=${TOKEN_SECRET}`;
  }

  let body = options.body;
  if (body != null && body !== "") {
    headers["Content-Type"] =
      options.contentType || "application/x-www-form-urlencoded";
    headers["Content-Length"] = String(Buffer.byteLength(body));
  } else if (method === "POST" || method === "PUT") {
    body = "";
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Content-Length"] = "0";
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 8006,
        path: u.pathname + u.search,
        method,
        headers,
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
          if (!text || !text.trim()) {
            resolve(null);
            return;
          }
          try {
            const json = JSON.parse(text);
            resolve(json.data !== undefined ? json.data : json);
          } catch {
            reject(
              new Error(`Ungültige Proxmox-Antwort: ${text.slice(0, 200)}`)
            );
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

    if (body != null) req.write(body);
    req.end();
  });
}

export async function getAuthTicket(): Promise<{
  ticket: string;
  CSRFPreventionToken: string;
  username: string;
} | null> {
  const user =
    process.env.PROXMOX_USER?.trim() ||
    process.env.PROXMOX_TOKEN_ID?.split("!")[0] ||
    "root@pam";
  const password = process.env.PROXMOX_PASSWORD?.trim();
  if (!password) return null;

  const body = new URLSearchParams();
  body.set("username", user);
  body.set("password", password);

  const full = `${PROXMOX_HOST}/api2/json/access/ticket`;
  const u = new URL(full);

  return new Promise((resolve, reject) => {
    const payload = body.toString();
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 8006,
        path: u.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": String(Buffer.byteLength(payload)),
        },
        rejectUnauthorized: !INSECURE,
        timeout: 15000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            const json = JSON.parse(text);
            const data = json.data;
            if (!data?.ticket) {
              resolve(null);
              return;
            }
            resolve({
              ticket: data.ticket,
              CSRFPreventionToken: data.CSRFPreventionToken,
              username: data.username || user,
            });
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
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

function storageContent(s: any): string {
  return String(s.content || "");
}

function isUsableForLxc(s: any): boolean {
  const name = String(s.storage || "");
  if (!name || name === "local-lvm") return false;
  if (s.enabled === 0 || s.enabled === false) return false;
  if (s.active === 0 || s.active === false) return false;
  const c = storageContent(s);
  return c.includes("rootdir") || c.includes("images");
}

export async function resolveStorage(
  node: string,
  preferred?: string | null
): Promise<string> {
  const data = await proxmoxRequest(`/nodes/${node}/storage`);
  if (!Array.isArray(data) || !data.length) {
    throw new Error("Kein Storage auf dem Node gefunden.");
  }

  const names = data.map((s: any) => String(s.storage));
  const available = names.join(", ");

  const candidates: string[] = [];

  const fromEnv = process.env.PROXMOX_STORAGE?.trim();
  if (fromEnv && fromEnv !== "auto" && fromEnv !== "local-lvm") {
    candidates.push(fromEnv);
  }

  if (
    preferred &&
    preferred !== "auto" &&
    preferred !== "local-lvm" &&
    preferred !== fromEnv
  ) {
    candidates.push(preferred);
  }

  for (const name of candidates) {
    if (names.includes(name)) return name;
  }

  const usable = data.filter(isUsableForLxc);

  const rootdir = usable.find((s: any) =>
    storageContent(s).includes("rootdir")
  );
  if (rootdir) return String(rootdir.storage);

  const images = usable.find((s: any) =>
    storageContent(s).includes("images")
  );
  if (images) return String(images.storage);

  if (names.includes("local")) return "local";

  const any = data.find((s: any) => {
    const name = String(s.storage || "");
    if (name === "local-lvm") return false;
    if (s.enabled === 0 || s.enabled === false) return false;
    const c = storageContent(s);
    if (c === "backup" || c === "iso" || c === "vztmpl") return false;
    return true;
  });

  if (any) return String(any.storage);

  throw new Error(
    `Kein Storage für LXC-Disks gefunden. Verfügbar: ${available}. ` +
      `In Vercel PROXMOX_STORAGE setzen (z.B. local).`
  );
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
  if (opts.disk.startsWith("local-lvm:")) {
    throw new Error(
      "Storage local-lvm ist ungültig. PROXMOX_STORAGE auf ein existierendes Storage setzen."
    );
  }

  const body = new URLSearchParams();
  body.set("vmid", String(opts.vmid));
  body.set("hostname", opts.hostname);
  body.set("password", opts.password);
  body.set("cores", String(opts.cores));
  body.set("memory", String(opts.memory));
  body.set("rootfs", opts.disk);
  body.set("ostemplate", opts.ostemplate);
  body.set("net0", opts.net0 || "name=eth0,bridge=vmbr2,ip=dhcp");
  body.set("start", "1");
  body.set("unprivileged", "1");

  return proxmoxRequest(`/nodes/${opts.node}/lxc`, {
    method: "POST",
    body: body.toString(),
    contentType: "application/x-www-form-urlencoded",
  });
}

/**
 * LXC von einem CT-Template klonen (pct template / "Convert to template").
 */
export async function cloneLxcFromTemplate(opts: {
  node: string;
  templateVmid: number;
  newid: number;
  hostname: string;
  password: string;
  cores: number;
  memory: number;
  storage?: string;
}) {
  const body = new URLSearchParams();
  body.set("newid", String(opts.newid));
  body.set("hostname", opts.hostname);
  body.set("full", "1");
  body.set("target", opts.node);
  if (opts.storage) body.set("storage", opts.storage);

  await proxmoxRequest(
    `/nodes/${opts.node}/lxc/${opts.templateVmid}/clone`,
    {
      method: "POST",
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    }
  );

  await new Promise((r) => setTimeout(r, 5000));

  const conf = new URLSearchParams();
  conf.set("cores", String(opts.cores));
  conf.set("memory", String(opts.memory));
  conf.set("hostname", opts.hostname);
  conf.set("password", opts.password);

  await proxmoxRequest(`/nodes/${opts.node}/lxc/${opts.newid}/config`, {
    method: "PUT",
    body: conf.toString(),
    contentType: "application/x-www-form-urlencoded",
  });

  await startLxc(opts.node, opts.newid);
}

/** RAM (MB) und/oder SSD (GB) eines LXC erhöhen. Disk nur vergrößern. */
export async function resizeLxc(opts: {
  node: string;
  vmid: number;
  memoryMb?: number;
  diskGb?: number;
}) {
  if (opts.memoryMb != null) {
    const conf = new URLSearchParams();
    conf.set("memory", String(Math.round(opts.memoryMb)));
    await proxmoxRequest(`/nodes/${opts.node}/lxc/${opts.vmid}/config`, {
      method: "PUT",
      body: conf.toString(),
      contentType: "application/x-www-form-urlencoded",
    });
  }

  if (opts.diskGb != null) {
    const body = new URLSearchParams();
    body.set("disk", "rootfs");
    body.set("size", `${Math.round(opts.diskGb)}G`);
    await proxmoxRequest(`/nodes/${opts.node}/lxc/${opts.vmid}/resize`, {
      method: "PUT",
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });
  }
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
  return proxmoxRequest(
    `/nodes/${node}/lxc/${vmid}?purge=1&destroy-unreferenced-disks=1`,
    { method: "DELETE" }
  );
}

export async function getLxcStatus(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/status/current`);
}

export async function getLxcConfig(node: string, vmid: number) {
  return proxmoxRequest(`/nodes/${node}/lxc/${vmid}/config`);
}

export async function createTermProxy(
  node: string,
  vmid: number
): Promise<{ port: number | string; ticket: string; user: string }> {
  const auth = await getAuthTicket();

  const referer = `${PROXMOX_HOST}/?console=lxc&xtermjs=1&vmid=${vmid}&node=${node}`;

  if (auth) {
    const data = await proxmoxRequest(`/nodes/${node}/lxc/${vmid}/termproxy`, {
      method: "POST",
      cookie: `PVEAuthCookie=${auth.ticket}`,
      extraHeaders: {
        CSRFPreventionToken: auth.CSRFPreventionToken,
        Referer: referer,
      },
    });
    return {
      port: data.port,
      ticket: data.ticket,
      user: auth.username.split("!")[0],
    };
  }

  const data = await proxmoxRequest(`/nodes/${node}/lxc/${vmid}/termproxy`, {
    method: "POST",
    extraHeaders: { Referer: referer },
  });

  const rawUser =
    data.user ||
    process.env.PROXMOX_TOKEN_ID?.split("!")[0] ||
    "root@pam";

  return {
    port: data.port,
    ticket: data.ticket,
    user: String(rawUser).split("!")[0],
  };
}

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
