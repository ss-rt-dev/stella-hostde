/**
 * Proxmox API Client für LXC-Container
 * Benötigt: PROXMOX_HOST, PROXMOX_TOKEN_ID, PROXMOX_TOKEN_SECRET
 * Token-Format: user@pam!tokenid
 */

const PROXMOX_HOST = process.env.PROXMOX_HOST || "";
const TOKEN_ID = process.env.PROXMOX_TOKEN_ID || "";
const TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET || "";

function getAuthHeader() {
  return {
    Authorization: `PVEAPIToken=${TOKEN_ID}=${TOKEN_SECRET}`,
  };
}

async function proxmoxFetch(path: string, options: RequestInit = {}) {
  if (!PROXMOX_HOST) {
    throw new Error("PROXMOX_HOST ist nicht gesetzt");
  }

  const url = `${PROXMOX_HOST.replace(/\/$/, "")}/api2/json${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // Proxmox oft selbstsigniertes Zertifikat
    // In Produktion idealerweise gültiges Zertifikat nutzen
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxmox API Fehler ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data;
}

export async function getNextVmid(): Promise<number> {
  const data = await proxmoxFetch("/cluster/nextid");
  return Number(data);
}

export interface CreateLxcOptions {
  vmid: number;
  hostname: string;
  password: string;
  cores: number;
  memory: number; // MB
  disk: string; // z.B. "local-lvm:8"
  ostemplate: string;
  node: string;
  storage?: string;
  net0?: string; // z.B. "name=eth0,bridge=vmbr0,ip=dhcp"
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
  body.set("start", "1"); // direkt starten
  body.set("unprivileged", "1");

  const url = `${PROXMOX_HOST.replace(/\/$/, "")}/api2/json/nodes/${opts.node}/lxc`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LXC erstellen fehlgeschlagen: ${text}`);
  }

  const data = await res.json();
  return data.data; // UPID
}

export async function startLxc(node: string, vmid: number) {
  return proxmoxFetch(`/nodes/${node}/lxc/${vmid}/status/start`, {
    method: "POST",
  });
}

export async function stopLxc(node: string, vmid: number) {
  return proxmoxFetch(`/nodes/${node}/lxc/${vmid}/status/stop`, {
    method: "POST",
  });
}

export async function deleteLxc(node: string, vmid: number) {
  return proxmoxFetch(`/nodes/${node}/lxc/${vmid}`, {
    method: "DELETE",
  });
}

export async function getLxcStatus(node: string, vmid: number) {
  return proxmoxFetch(`/nodes/${node}/lxc/${vmid}/status/current`);
}

export async function getLxcConfig(node: string, vmid: number) {
  return proxmoxFetch(`/nodes/${node}/lxc/${vmid}/config`);
}
