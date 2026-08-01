/** Discord Webhook für neue Support-Tickets */

export async function sendSupportTicketWebhook(opts: {
  ticketId: string;
  subject: string;
  description: string;
  type: "GENERAL" | "SERVER";
  userName: string;
  userEmail: string;
}) {
  const url = process.env.DISCORD_SUPPORT_WEBHOOK?.trim();
  if (!url) return;

  const typeLabel =
    opts.type === "SERVER" ? "Server Support" : "Normaler Support";
  const color = opts.type === "SERVER" ? 0xf59e0b : 0x3b82f6;
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://stella-host.de";
  const adminUrl = `${base}/admin/support/${opts.ticketId}`;

  const desc =
    opts.description.length > 800
      ? opts.description.slice(0, 797) + "…"
      : opts.description;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Stella Host Support",
        embeds: [
          {
            title: "Neues Support-Ticket",
            color,
            fields: [
              { name: "Grund", value: opts.subject || "—", inline: false },
              { name: "Art", value: typeLabel, inline: true },
              {
                name: "Nutzer",
                value: `${opts.userName || "—"}\n${opts.userEmail}`,
                inline: true,
              },
              { name: "Beschreibung", value: desc || "—", inline: false },
            ],
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
