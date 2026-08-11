"use client";

import {
  ROLE_COLORS,
  ROLE_LABELS,
  isStaffRole,
  isSuperOwner,
  type AppRole,
} from "@/lib/roles";

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
  userRole,
  isStaff,
  createdAt,
}: {
  body: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  isStaff?: boolean;
  createdAt: string;
}) {
  const email = (userEmail || "").toLowerCase().trim();
  const isJustin = isSuperOwner(email);
  const displayName = userName || userEmail || "Nutzer";
  const role = (userRole || "CUSTOMER") as AppRole;
  const roleHex = ROLE_COLORS[role] || ROLE_COLORS.CUSTOMER;
  const showRoleAnim =
    !isJustin &&
    (isStaff ||
      isStaffRole(role) ||
      role === "VIP" ||
      role === "SPONSOR" ||
      role === "PARTNER" ||
      role === "OWNER");
  const accent =
    isStaff || isStaffRole(role) || role === "OWNER"
      ? roleHex
      : hashColor(email || displayName);
  const label = isJustin
    ? "Owner"
    : role === "OWNER"
      ? "Owner"
      : ROLE_LABELS[role] || (isStaff ? "Staff" : null);

  const time = new Date(createdAt).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={
        isJustin
          ? "msg-embed-rainbow relative overflow-hidden rounded-lg bg-[#1e1f22] shadow-sm"
          : showRoleAnim
            ? "msg-embed-role relative overflow-hidden rounded-lg bg-[#1e1f22] shadow-sm"
            : "relative overflow-hidden rounded-lg bg-[#1e1f22] shadow-sm"
      }
      style={
        isJustin
          ? undefined
          : showRoleAnim
            ? ({ ["--role-color" as string]: roleHex } as React.CSSProperties)
            : { borderLeft: `4px solid ${accent}` }
      }
    >
      <div className="relative z-[1] px-3.5 py-2.5 pl-4">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold" style={{ color: isJustin ? "#e4e4e7" : accent }}>
            {displayName}
          </span>
          {isJustin && (
            <span className="rainbow-badge rounded px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {label}
            </span>
          )}
          {!isJustin && showRoleAnim && label && (
            <span
              className="role-badge rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ ["--role-color" as string]: roleHex } as React.CSSProperties}
            >
              {label}
            </span>
          )}
          <span className="text-[11px] text-zinc-500">{time}</span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-200">{body}</p>
      </div>
    </div>
  );
}
