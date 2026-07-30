import { randomBytes } from "crypto";

/** Zufällige alphanumerische ID für öffentliche Server-URLs */
export function randomAccessSlug(length = 16): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
