import { requireSession } from "../../lib/auth.js";
import { handleError, methodNotAllowed, readJson, sendError, sendJson } from "../../lib/http.js";
import { getAdminContent, saveContent, validateContent } from "../../lib/store.js";

export default async function handler(req, res) {
  try {
    const session = requireSession(req, res);
    if (!session) return;

    if (req.method === "GET") {
      const content = await getAdminContent();
      sendJson(res, 200, { content });
      return;
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      const problem = validateContent(body);
      if (problem) {
        sendError(res, 400, problem);
        return;
      }
      const savedAt = await saveContent(body);
      sendJson(res, 200, { ok: true, savedAt });
      return;
    }

    methodNotAllowed(res, "GET, PUT");
  } catch (error) {
    handleError(res, error, "Gagal memproses konten.");
  }
}
