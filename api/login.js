import { createSessionToken, passwordMatches, sessionCookie, SESSION_TTL_MS } from "../lib/auth.js";
import { clientIp, handleError, readJson, sendError, sendJson } from "../lib/http.js";
import {
  MAX_LOGIN_ATTEMPTS,
  clearLoginAttempts,
  countRecentLoginAttempts,
  pruneLoginAttempts,
  recordLoginAttempt,
} from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "Metode tidak diizinkan.");
    return;
  }

  try {
    const ip = clientIp(req);

    let attempts = 0;
    try {
      attempts = await countRecentLoginAttempts(ip);
    } catch (error) {
      // Jika tabel rate limit tidak tersedia, jangan blokir login.
      console.error("[login] rate limit tidak tersedia:", error.message);
    }
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      sendError(res, 429, "Terlalu banyak percobaan. Coba lagi dalam 10 menit.");
      return;
    }

    const body = await readJson(req, 16 * 1024);
    const valid = Boolean(body.password) && passwordMatches(body.password);

    if (!valid) {
      try {
        await recordLoginAttempt(ip);
      } catch (error) {
        console.error("[login] gagal mencatat percobaan:", error.message);
      }
      sendError(res, 401, "Kata sandi salah.");
      return;
    }

    try {
      await clearLoginAttempts(ip);
      await pruneLoginAttempts();
    } catch (error) {
      console.error("[login] gagal membersihkan percobaan:", error.message);
    }

    const token = createSessionToken();
    res.setHeader("Set-Cookie", sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)));
    sendJson(res, 200, { ok: true });
  } catch (error) {
    handleError(res, error, "Gagal memproses login.");
  }
}
