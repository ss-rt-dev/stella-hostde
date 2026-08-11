"use client";

const JUSTIN_EMAIL = "justin@stella-host.de";

function hashColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 55%)`;
}

export function MessageEmbed({
  body,
  userName,
  userEmail,
  isStaff,
  createdAt,
}: {
  body: string;
  userName?: string | null;
  userEmail?: string | null;
  isStaff?: boolean;
  createdAt: string;
}) {
  const email = (userEmail || "").toLowerCase();
  const isJustin = email === JUSTIN_EMAIL;
  const displayName = userName || userEmail || "Nutzer";
  const accent = isStaff ? "#fbbf24" : hashColor(email || displayName);

  const time = new Date(createdAt).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[#1e1f22] shadow-sm ${
        isJustin ? "msg-embed-rainbow" : ""
      }`}
      style={
        isJustin
          ? undefined
          : {
              borderLeft: `4px solid ${accent}`,
            }
      }
    >
      <div className="px-3.5 py-2.5">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-sm font-semibold ${isJustin ? "text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 to-purple-400" : ""}`}
            style={isJustin ? undefined : { color: accent }}
          >
            {displayName}
          </span>
          {isStaff && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
              Staff
            </span>
          )}
          {isJustin && (
            <span className="rounded bg-gradient-to-r from-pink-500/30 to-violet-500/30 px-1.5 py-0.5 text-[10px] font-medium text-pink-200">
              Owner
            </span>
          )}
          <span className="text-[11px] text-zinc-500">{time}</span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-200">
          {body}
        </p>
      </div>
    </div>
  );
}
