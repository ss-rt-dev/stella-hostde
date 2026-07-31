const LOGO =
  "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch(LOGO, {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "StellaHost-Favicon/1" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a0a0c"/><text x="32" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="#fbbf24">S</text></svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
