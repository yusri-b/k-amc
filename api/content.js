import { handleError, methodNotAllowed, sendJson } from "../lib/http.js";
import { getPublicContent } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res, "GET");
    return;
  }

  try {
    const content = await getPublicContent();
    sendJson(res, 200, content);
  } catch (error) {
    handleError(res, error, "Konten belum tersedia.");
  }
}
