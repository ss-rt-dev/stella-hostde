/** Landing / öffentliche Seiten – goldenes S */
export const runtime = "edge";

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0a0a0c"/>
  <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.5"/>
  <text x="32" y="44" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="34" font-weight="700" fill="#fbbf24">S</text>
</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
