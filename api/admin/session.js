import { requireSession } from "../../lib/auth.js";
import { handleError, methodNotAllowed, sendJson } from "../../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res, "GET");
    return;
  }

  try {
    const session = requireSession(req, res);
    if (!session) return;
    sendJson(res, 200, {
      authenticated: true,
      expires: new Date(session.exp).toISOString(),
    });
  } catch (error) {
    handleError(res, error, "Gagal memeriksa sesi.");
  }
}
