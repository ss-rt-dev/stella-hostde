export type ServerKind = "DEBIAN" | "MINECRAFT" | "DISCORD_BOT";

export const MINECRAFT_VARIANTS = [
  { id: "paper", label: "Paper" },
  { id: "vanilla", label: "Vanilla (Java)" },
  { id: "purpur", label: "Purpur" },
  { id: "fabric", label: "Fabric" },
  { id: "spigot", label: "Spigot" },
] as const;

export const DISCORD_VARIANTS = [
  { id: "python", label: "Python (discord.py)" },
  { id: "nodejs", label: "Node.js (discord.js)" },
] as const;
