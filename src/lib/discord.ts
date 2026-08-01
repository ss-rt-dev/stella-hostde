/** Discord Webhook für neue Support-Tickets */

const SUPPORT_ROLE_ID = "1523343547669938266";

export async function sendSupportTicketWebhook(opts: {
  ticketId: string;
  subject: string;
  description: string;
  type: "GENERAL" | "SERVER" | "TEAM_APPLICATION";
  userName: string;
  userEmail: string;
  discordName?: string;
  applyRole?: string;
}) {
  const url = process.env.DISCORD_SUPPORT_WEBHOOK?.trim();
  if (!url) return;

  const typeLabel =
    opts.type === "SERVER"
      ? "Server Support"
      : opts.type === "TEAM_APPLICATION"
        ? "Team Bewerbung"
        : "Normaler Support";
  const color =
    opts.type === "SERVER"
      ? 0xf59e0b
      : opts.type === "TEAM_APPLICATION"
        ? 0xa855f7
        : 0x3b82f6;
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://stella-host.de";
  const adminUrl = `${base}/admin/support/${opts.ticketId}`;

  const desc =
    opts.description.length > 800
      ? opts.description.slice(0, 797) + "…"
      : opts.description;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Grund", value: opts.subject || "—", inline: false },
    { name: "Art", value: typeLabel, inline: true },
    {
      name: "Nutzer",
      value: `${opts.userName || "—"}\n${opts.userEmail}`,
      inline: true,
    },
  ];

  if (opts.type === "TEAM_APPLICATION") {
    fields.push(
      {
        name: "Discord",
        value: opts.discordName || "—",
        inline: true,
      },
      {
        name: "Bewerbung als",
        value: opts.applyRole || "—",
        inline: true,
      }
    );
  }

  fields.push({ name: "Beschreibung", value: desc || "—", inline: false });

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Stella Host Support",
        content: `<@&${SUPPORT_ROLE_ID}>`,
        allowed_mentions: {
          roles: [SUPPORT_ROLE_ID],
        },
        embeds: [
          {
            title:
              opts.type === "TEAM_APPLICATION"
                ? "Neue Team-Bewerbung"
                : "Neues Support-Ticket",
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
