/**
 * Auto-Install Scripts für Minecraft / Discord-Bots im LXC.
 * Ausführung über Proxmox-Host: pct exec <vmid> -- bash -c '...'
 * Braucht SSH zum Proxmox: PROXMOX_SSH_HOST + PROXMOX_SSH_USER + PROXMOX_SSH_PASSWORD
 * (oder Key via PROXMOX_SSH_KEY). Ohne SSH → Setup-Script wird nur als Note gespeichert.
 */

import { spawn } from "child_process";

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

function shellEscape(s: string): string {
  return `'` + s.replace(/'/g, `'"'"'`) + `'`;
}

/** Bash-Script das im Container läuft */
export function buildSetupScript(opts: {
  kind: ServerKind;
  variant: string;
  version?: string;
}): string {
  const { kind, variant } = opts;
  const version = opts.version || "latest";

  if (kind === "MINECRAFT") {
    return `
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq openjdk-21-jre-headless curl wget screen unzip > /dev/null
mkdir -p /opt/minecraft && cd /opt/minecraft
echo "eula=true" > eula.txt

case ${shellEscape(variant)} in
  paper)
    VER=$(curl -fsSL https://api.papermc.io/v2/projects/paper | grep -oP '"version_groups":\[[^]]*' | tail -1 || true)
    # neueste Build von Paper 1.21.x
    MC_VER=$(curl -fsSL https://api.papermc.io/v2/projects/paper | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['versions'][-1])" 2>/dev/null || echo "1.21.4")
    BUILD=$(curl -fsSL "https://api.papermc.io/v2/projects/paper/versions/$MC_VER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['builds'][-1])")
    curl -fsSL -o server.jar "https://api.papermc.io/v2/projects/paper/versions/$MC_VER/builds/$BUILD/downloads/paper-$MC_VER-$BUILD.jar"
    ;;
  purpur)
    MC_VER=$(curl -fsSL https://api.purpurmc.org/v2/purpur | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['versions'][-1])" 2>/dev/null || echo "1.21.4")
    curl -fsSL -o server.jar "https://api.purpurmc.org/v2/purpur/$MC_VER/latest/download"
    ;;
  fabric)
    curl -fsSL -o fabric-installer.jar https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.0.1/fabric-installer-1.0.1.jar
    java -jar fabric-installer.jar server -downloadMinecraft -mcversion 1.21.4 || true
    [ -f fabric-server-launch.jar ] && mv fabric-server-launch.jar server.jar || true
    [ ! -f server.jar ] && curl -fsSL -o server.jar https://meta.fabricmc.net/v2/versions/loader/1.21.4/0.16.9/1.0.1/server/jar
    ;;
  spigot)
    # Spigot via BuildTools dauert lange – Fallback Paper wenn BuildTools fehlt
    apt-get install -y -qq git > /dev/null
    curl -fsSL -o BuildTools.jar https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar
    java -jar BuildTools.jar --rev 1.21.4 || curl -fsSL -o server.jar https://cdn.jsdelivr.net/gh/PaperMC/paperclip@master/paperclip.jar
    [ -f spigot-*.jar ] && mv spigot-*.jar server.jar || true
    ;;
  vanilla|*)
    MANIFEST=$(curl -fsSL https://launchermeta.mojang.com/mc/game/version_manifest_v2.json)
    VER_URL=$(echo "$MANIFEST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next(v['url'] for v in d['versions'] if v['id']==d['latest']['release']))")
    JAR_URL=$(curl -fsSL "$VER_URL" | python3 -c "import sys,json; print(json.load(sys.stdin)['downloads']['server']['url'])")
    curl -fsSL -o server.jar "$JAR_URL"
    ;;
esac

cat > /opt/minecraft/start.sh << 'EOF'
#!/bin/bash
cd /opt/minecraft
exec java -Xms512M -Xmx$(($(free -m | awk '/Mem:/{print int($2*0.7)}')))M -jar server.jar nogui
EOF
chmod +x /opt/minecraft/start.sh

cat > /etc/systemd/system/minecraft.service << 'EOF'
[Unit]
Description=Minecraft Server
After=network.target

[Service]
WorkingDirectory=/opt/minecraft
ExecStart=/opt/minecraft/start.sh
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable minecraft
systemctl start minecraft || true
echo "Minecraft ${shellEscape(variant)} installiert"
`.trim();
  }

  if (kind === "DISCORD_BOT" && variant === "python") {
    return `
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git > /dev/null
mkdir -p /opt/discord-bot && cd /opt/discord-bot
python3 -m venv venv
./venv/bin/pip install -q discord.py python-dotenv
cat > bot.py << 'PY'
import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN", "")
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

@bot.command()
async def ping(ctx):
    await ctx.send("Pong!")

if __name__ == "__main__":
    if not TOKEN:
        print("Setze DISCORD_TOKEN in /opt/discord-bot/.env")
    else:
        bot.run(TOKEN)
PY
echo "DISCORD_TOKEN=dein_token_hier" > .env
cat > /etc/systemd/system/discord-bot.service << 'EOF'
[Unit]
Description=Discord Bot (Python)
After=network.target

[Service]
WorkingDirectory=/opt/discord-bot
ExecStart=/opt/discord-bot/venv/bin/python bot.py
Restart=on-failure
EnvironmentFile=-/opt/discord-bot/.env

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable discord-bot
echo "Discord Python-Bot installiert – Token in /opt/discord-bot/.env setzen"
`.trim();
  }

  if (kind === "DISCORD_BOT" && variant === "nodejs") {
    return `
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl > /dev/null
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs > /dev/null
mkdir -p /opt/discord-bot && cd /opt/discord-bot
npm init -y
npm install discord.js dotenv
cat > index.js << 'JS'
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
client.once('ready', () => console.log('Logged in as', client.user.tag));
client.on('messageCreate', (msg) => {
  if (msg.content === '!ping') msg.reply('Pong!');
});
const token = process.env.DISCORD_TOKEN;
if (!token) console.log('Setze DISCORD_TOKEN in /opt/discord-bot/.env');
else client.login(token);
JS
echo "DISCORD_TOKEN=dein_token_hier" > .env
cat > /etc/systemd/system/discord-bot.service << 'EOF'
[Unit]
Description=Discord Bot (Node.js)
After=network.target

[Service]
WorkingDirectory=/opt/discord-bot
ExecStart=/usr/bin/node index.js
Restart=on-failure
EnvironmentFile=-/opt/discord-bot/.env

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable discord-bot
echo "Discord Node.js-Bot installiert – Token in /opt/discord-bot/.env setzen"
`.trim();
  }

  return "echo 'Kein Extra-Setup (Debian)'";
}

function runSsh(command: string): Promise<{ ok: boolean; out: string }> {
  const host = process.env.PROXMOX_SSH_HOST || "";
  const user = process.env.PROXMOX_SSH_USER || "root";
  const password = process.env.PROXMOX_SSH_PASSWORD || "";
  const key = process.env.PROXMOX_SSH_KEY || "";

  if (!host) {
    return Promise.resolve({
      ok: false,
      out: "PROXMOX_SSH_HOST nicht gesetzt – Setup übersprungen",
    });
  }

  return new Promise((resolve) => {
    // sshpass wenn Passwort, sonst ssh -i
    const args = [
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "ConnectTimeout=20",
      `${user}@${host}`,
      command,
    ];
    let bin = "ssh";
    let finalArgs = args;
    if (password) {
      bin = "sshpass";
      finalArgs = ["-p", password, "ssh", ...args];
    } else if (key) {
      // key path would need file on disk – skip for serverless
      finalArgs = ["-i", key, ...args];
    }

    const child = spawn(bin, finalArgs, { timeout: 300000 });
    let out = "";
    child.stdout?.on("data", (d) => (out += d.toString()));
    child.stderr?.on("data", (d) => (out += d.toString()));
    child.on("error", (err) => {
      resolve({ ok: false, out: err.message });
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, out: out.slice(0, 2000) });
    });
  });
}

/** Führt Setup im LXC aus (via pct exec auf dem Proxmox-Host) */
export async function runSoftwareSetup(opts: {
  vmid: number;
  kind: ServerKind;
  variant: string;
  version?: string;
}): Promise<{ status: string; note: string }> {
  if (opts.kind === "DEBIAN") {
    return { status: "skipped", note: "Reines Debian – kein Extra-Setup" };
  }

  const script = buildSetupScript(opts);
  // Script base64, damit Quoting sicher ist
  const b64 = Buffer.from(script, "utf8").toString("base64");
  const remote = `pct exec ${opts.vmid} -- bash -c ${shellEscape(
    `echo ${b64} | base64 -d | bash`
  )}`;

  const result = await runSsh(remote);
  if (result.ok) {
    return {
      status: "done",
      note: result.out || "Setup abgeschlossen",
    };
  }

  // Ohne SSH: Hinweis speichern – User kann Script per Console ausführen
  return {
    status: "pending",
    note:
      result.out +
      " | Setup-Script liegt bereit. Optional PROXMOX_SSH_HOST setzen oder manuell in der Console: siehe Docs. Variante: " +
      opts.variant,
  };
}
