import type { ServerKind } from "./software-variants";

/**
 * Welches Proxmox-Template für welchen Server-Typ.
 *
 * Vercel Env (eine Variante reicht):
 *
 * 1) CT-Template klonen (empfohlen):
 *    PROXMOX_MINECRAFT_TEMPLATE_VMID=9100
 *    (Container 9100 vorher mit "Convert to template" / pct template)
 *
 * 2) OS-Template (vztmpl):
 *    PROXMOX_TEMPLATE_MINECRAFT=local:vztmpl/minecraft-paper_....tar.zst
 *
 * Optional Discord:
 *    PROXMOX_DISCORD_TEMPLATE_VMID=9101
 *    PROXMOX_TEMPLATE_DISCORD=local:vztmpl/...
 */

export function getTemplateVmid(kind: ServerKind): number | null {
  if (kind === "MINECRAFT") {
    const v = process.env.PROXMOX_MINECRAFT_TEMPLATE_VMID?.trim();
    if (v && /^\d+$/.test(v)) return Number(v);
  }
  if (kind === "DISCORD_BOT") {
    const v = process.env.PROXMOX_DISCORD_TEMPLATE_VMID?.trim();
    if (v && /^\d+$/.test(v)) return Number(v);
  }
  return null;
}

export function getOstemplate(
  kind: ServerKind,
  fallback: string
): string {
  if (kind === "MINECRAFT") {
    const t = process.env.PROXMOX_TEMPLATE_MINECRAFT?.trim();
    if (t) return t;
  }
  if (kind === "DISCORD_BOT") {
    const t = process.env.PROXMOX_TEMPLATE_DISCORD?.trim();
    if (t) return t;
  }
  return fallback;
}

/** Wenn Template schon Minecraft enthält → Setup-Script überspringen */
export function shouldSkipSoftwareSetup(kind: ServerKind): boolean {
  if (kind === "DEBIAN") return true;
  if (kind === "MINECRAFT") {
    if (process.env.PROXMOX_MINECRAFT_TEMPLATE_VMID?.trim()) return true;
    if (process.env.PROXMOX_TEMPLATE_MINECRAFT?.trim()) return true;
    if (process.env.PROXMOX_MINECRAFT_SKIP_SETUP === "1") return true;
  }
  if (kind === "DISCORD_BOT") {
    if (process.env.PROXMOX_DISCORD_TEMPLATE_VMID?.trim()) return true;
    if (process.env.PROXMOX_TEMPLATE_DISCORD?.trim()) return true;
  }
  return false;
}
