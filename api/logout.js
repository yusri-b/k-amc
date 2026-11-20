import { clearSessionCookie } from "../lib/auth.js";
import { handleError, sendError, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "Metode tidak diizinkan.");
    return;
  }

  try {
    res.setHeader("Set-Cookie", clearSessionCookie());
    sendJson(res, 200, { ok: true });
  } catch (error) {
    handleError(res, error, "Gagal keluar.");
  }
}
