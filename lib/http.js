/**
 * Helper HTTP untuk Vercel Functions.
 * Dipakai oleh semua route di folder `api/`.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
    ...extra,
  };
}

export function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(
    status,
    securityHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
      ...extraHeaders,
    })
  );
  res.end(body);
}

export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

export function handleError(res, error, fallback = "Terjadi kesalahan pada server.") {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error("[api]", error);
  if (res.headersSent) {
    res.end();
    return;
  }
  sendError(res, status, status >= 500 ? fallback : error.message);
}

export function methodNotAllowed(res, allow) {
  res.setHeader("Allow", allow);
  sendError(res, 405, "Metode tidak diizinkan.");
}

export function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) {
        reject(new HttpError(413, `Ukuran data melebihi batas ${Math.round(limit / 1024 / 1024)} MB.`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

export async function readJson(req, limit = 1024 * 1024) {
  const contentType = String(req.headers["content-type"] || "");
  if (!contentType.includes("application/json")) {
    throw new HttpError(415, "Content-Type harus application/json.");
  }
  const raw = await readBody(req, limit);
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw new HttpError(400, "Body JSON tidak valid.");
  }
}

export function parseCookies(header) {
  const cookies = {};
  String(header || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index === -1) return;
      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    });
  return cookies;
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}
