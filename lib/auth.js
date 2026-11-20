/**
 * Autentikasi admin tanpa state: kata sandi dari environment dan sesi
 * bertanda tangan HMAC (cocok untuk serverless/Vercel).
 */
import crypto from "node:crypto";
import { HttpError, parseCookies, sendError } from "./http.js";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COOKIE_NAME = "admin_session";

function adminPassword() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) {
    throw new HttpError(500, "ADMIN_PASSWORD belum diatur di environment.");
  }
  return value;
}

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new HttpError(500, "SESSION_SECRET belum diatur (minimal 16 karakter).");
  }
  return value;
}

export function passwordMatches(input) {
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(adminPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(payload) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken() {
  const exp = Date.now() + SESSION_TTL_MS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const [expRaw, signature] = String(token).split(".");
  if (!expRaw || !signature) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp <= Date.now()) return null;

  const expected = sign(expRaw);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return { exp };
}

export function sessionFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return verifySessionToken(token);
}

export function requireSession(req, res) {
  const session = sessionFromRequest(req);
  if (!session) {
    sendError(res, 401, "Tidak terautentikasi. Silakan masuk kembali.");
    return null;
  }
  return session;
}

export function sessionCookie(token, maxAgeSeconds) {
  return [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
    "Secure",
  ].join("; ");
}

export function clearSessionCookie() {
  return sessionCookie("", 0);
}
