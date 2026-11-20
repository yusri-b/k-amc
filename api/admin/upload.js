import { requireSession } from "../../lib/auth.js";
import { handleError, methodNotAllowed, readBody, sendError, sendJson } from "../../lib/http.js";
import { MAX_UPLOAD_BYTES, detectImageType } from "../../lib/images.js";
import { uploadImage } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res, "POST");
    return;
  }

  try {
    const session = requireSession(req, res);
    if (!session) return;

    const raw = await readBody(req, MAX_UPLOAD_BYTES);
    if (raw.length === 0) {
      sendError(res, 400, "Berkas kosong.");
      return;
    }

    const type = detectImageType(raw);
    if (!type) {
      sendError(res, 415, "Format gambar tidak didukung. Gunakan WebP, PNG, JPG, atau GIF.");
      return;
    }

    const result = await uploadImage(raw, type);
    sendJson(res, 201, result);
  } catch (error) {
    handleError(res, error, "Gagal mengunggah gambar.");
  }
}
