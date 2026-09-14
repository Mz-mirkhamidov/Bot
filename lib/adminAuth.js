// Admin panel uchun sodda sessiya autentifikatsiyasi.
// Baza yoki tashqi kutubxonasiz: cookie ichida "muddat.imzo" saqlanadi,
// imzo HMAC-SHA256 bilan tekshiriladi — soxtalashtirib bo'lmaydi.

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const SESSION_HOURS = 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const token = `${exp}.${sign(String(exp))}`;
  const maxAge = SESSION_HOURS * 3600;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function isAuthed(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token || !token.includes(".")) return false;

  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || Date.now() / 1000 > exp) return false;

  const expected = sign(expStr);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(input) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || !input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireAuth(req, res) {
  if (!isAuthed(req)) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return false;
  }
  return true;
}
