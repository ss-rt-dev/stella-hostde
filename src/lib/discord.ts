/** Discord Webhook – nur Platform-Admin-Tickets (Staff-Ping) */

const SUPPORT_ROLE_ID = "1523343547669938266";

export async function sendSupportTicketWebhook(opts: {
  ticketId: string;
  subject: string;
  description: string;
  type: "GENERAL" | "SERVER" | "TEAM_APPLICATION" | "DISCORD";
  audience?: "TEAM" | "PLATFORM";
  userName: string;
  userEmail: string;
  discordName?: string;
  applyRole?: string;
  teamName?: string;
}) {
  // Team-Tickets nie an Discord – nur Platform
  if (opts.audience !== "PLATFORM") return;

  const url = process.env.DISCORD_SUPPORT_WEBHOOK?.trim();
  if (!url) return;

  const isApp = opts.type === "TEAM_APPLICATION";
  const typeLabel =
    opts.type === "SERVER"
      ? "Server Support"
      : isApp
        ? "Team Bewerbung"
        : opts.type === "DISCORD"
          ? "Discord"
          : "Allgemein";

  const color = isApp ? 0xa855f7 : 0xef4444;

  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://stella-host.de";
  const adminUrl = `${base}/admin/support/${opts.ticketId}`;

  const desc =
    opts.description.length > 800
      ? opts.description.slice(0, 797) + "…"
      : opts.description;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Betreff", value: opts.subject || "—", inline: false },
    { name: "Art", value: typeLabel, inline: true },
    {
      name: "Nutzer",
      value: `${opts.userName || "—"}\n${opts.userEmail}`,
      inline: true,
    },
  ];

  if (opts.teamName) {
    fields.push({ name: "Aktives Team", value: opts.teamName, inline: true });
  }

  if (isApp) {
    fields.push(
      { name: "Discord", value: opts.discordName || "—", inline: true },
      { name: "Bewerbung als", value: opts.applyRole || "—", inline: true }
    );
  }

  fields.push({ name: "Beschreibung", value: desc || "—", inline: false });

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: isApp ? "Stella Team-Bewerbung" : "Stella Admin Tickets",
        content: isApp
          ? `<@&${SUPPORT_ROLE_ID}> **Neue Team-Bewerbung**`
          : `<@&${SUPPORT_ROLE_ID}> **Neues Admin-Ticket**`,
        allowed_mentions: { roles: [SUPPORT_ROLE_ID] },
        embeds: [
          {
            title: isApp
              ? "📋 Neue Team-Bewerbung"
              : "🎫 Neues Ticket an Platform Admins",
            color,
            fields,
            footer: { text: `Ticket ${opts.ticketId}` },
            timestamp: new Date().toISOString(),
            url: adminUrl,
          },
        ],
      }),
    });
  } catch (e) {
    console.error("Discord webhook failed", e);
  }
}
