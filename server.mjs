/**
 * Klinik Aras — static site + content API.
 *
 * Zero runtime dependencies. Serves the landing page, the admin panel, a small
 * authenticated JSON API for editable content, and image uploads.
 *
 *   npm start
 *   ADMIN_PASSWORD="rahasia" PORT=8080 npm start
 */
import http from "node:http";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_FILE = path.join(ROOT, "content", "site.json");
const BACKUP_DIR = path.join(ROOT, "content", "backups");
const UPLOAD_DIR = path.join(ROOT, "assets", "img", "uploads");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const sessions = new Map();
const loginAttempts = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

const REQUIRED_KEYS = [
  "meta",
  "brand",
  "contact",
  "hero",
  "services",
  "why",
  "doctors",
  "steps",
  "testimonials",
  "appointment",
  "footer"
];

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
    ...extra
  };
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(
    status,
    securityHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
      ...extraHeaders
    })
  );
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, `Ukuran data melebihi batas ${Math.round(limit / 1024 / 1024)} MB.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req, limit = MAX_JSON_BYTES) {
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

function parseCookies(header) {
  const cookies = {};
  String(header || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index === -1) return;
      cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    });
  return cookies;
}

function sessionFromRequest(req) {
  const token = parseCookies(req.headers.cookie).admin_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function requireSession(req, res) {
  const session = sessionFromRequest(req);
  if (!session) {
    sendError(res, 401, "Tidak terautentikasi. Silakan masuk kembali.");
    return null;
  }
  return session;
}

function isSecureRequest(req) {
  return req.socket.encrypted || String(req.headers["x-forwarded-proto"] || "").includes("https");
}

function sessionCookie(req, token, maxAgeSeconds) {
  const parts = [
    `admin_session=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isSecureRequest(req)) parts.push("Secure");
  return parts.join("; ");
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function passwordMatches(input) {
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function normalizeContentPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    throw new HttpError(400, "URL tidak valid.");
  }
  if (decoded.includes("\0")) throw new HttpError(400, "URL tidak valid.");
  let relative = path.posix.normalize(decoded);
  if (relative === "/") relative = "/index.html";
  if (relative.endsWith("/")) relative += "index.html";
  return relative;
}

/* ------------------------------------------------------------------ */
/* Content storage                                                    */
/* ------------------------------------------------------------------ */

async function readContent() {
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  return JSON.parse(raw);
}

function validateContent(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Konten harus berupa objek JSON.";
  }
  for (const key of REQUIRED_KEYS) {
    if (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key])) {
      return `Bagian "${key}" wajib ada dan berupa objek.`;
    }
  }
  return null;
}

async function backupContent() {
  try {
    const existing = await fs.readFile(CONTENT_FILE, "utf8");
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(path.join(BACKUP_DIR, `site-${stamp}.json`), existing, "utf8");

    const files = (await fs.readdir(BACKUP_DIR))
      .filter((name) => name.startsWith("site-") && name.endsWith(".json"))
      .sort()
      .reverse();
    await Promise.all(
      files.slice(20).map((name) => fs.unlink(path.join(BACKUP_DIR, name)).catch(() => {}))
    );
  } catch {
    /* no previous content yet — nothing to back up */
  }
}

async function writeContent(data) {
  await backupContent();
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.mkdir(path.dirname(CONTENT_FILE), { recursive: true });
  const temp = `${CONTENT_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, json, "utf8");
  await fs.rename(temp, CONTENT_FILE);
}

/* ------------------------------------------------------------------ */
/* Uploads                                                            */
/* ------------------------------------------------------------------ */

function detectImageType(buffer) {
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer.toString("ascii", 1, 4) === "PNG"
  ) {
    return "png";
  }
  if (buffer.length > 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
    return "gif";
  }
  return null;
}

async function saveUpload(req) {
  const raw = await readBody(req, MAX_UPLOAD_BYTES);
  if (raw.length === 0) throw new HttpError(400, "Berkas kosong.");
  const type = detectImageType(raw);
  if (!type) throw new HttpError(415, "Format gambar tidak didukung. Gunakan WebP, PNG, JPG, atau GIF.");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `upload-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${type}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), raw);
  return { url: `/assets/img/uploads/${name}`, bytes: raw.length, type };
}

/* ------------------------------------------------------------------ */
/* Static files                                                       */
/* ------------------------------------------------------------------ */

function cacheControl(relative) {
  if (relative.startsWith("/assets/img/uploads/")) return "public, max-age=31536000, immutable";
  if (relative.startsWith("/assets/fonts/")) return "public, max-age=31536000, immutable";
  if (relative.endsWith(".html") || relative.endsWith(".js") || relative.endsWith(".css")) return "no-cache";
  return "public, max-age=3600";
}

async function serveStatic(req, res, urlPath) {
  if (urlPath === "/admin") {
    res.writeHead(308, securityHeaders({ Location: "/admin/" }));
    res.end();
    return;
  }

  const relative = normalizeContentPath(urlPath);
  const allowed =
    relative === "/index.html" || relative.startsWith("/admin/") || relative.startsWith("/assets/");
  if (!allowed) {
    sendError(res, 404, "Halaman tidak ditemukan.");
    return;
  }

  const filePath = path.join(ROOT, relative);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    sendError(res, 404, "Halaman tidak ditemukan.");
    return;
  }

  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch {
    sendError(res, 404, "Halaman tidak ditemukan.");
    return;
  }
  if (!stats.isFile()) {
    sendError(res, 404, "Halaman tidak ditemukan.");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const headers = securityHeaders({
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": stats.size,
    "Cache-Control": cacheControl(relative),
    "Last-Modified": stats.mtime.toUTCString()
  });

  if (ext === ".html") {
    headers["Content-Security-Policy"] =
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'";
  }

  if (req.method === "HEAD") {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  res.writeHead(200, headers);
  createReadStream(filePath).pipe(res);
}

/* ------------------------------------------------------------------ */
/* API routing                                                        */
/* ------------------------------------------------------------------ */

async function handleApi(req, res, urlPath) {
  const method = req.method || "GET";

  if (urlPath === "/api/content" && method === "GET") {
    try {
      const content = await readContent();
      sendJson(res, 200, content);
    } catch {
      sendError(res, 500, "Konten belum tersedia.");
    }
    return;
  }

  if (urlPath === "/api/admin/session" && method === "GET") {
    const session = requireSession(req, res);
    if (!session) return;
    sendJson(res, 200, { authenticated: true, expires: new Date(session.expires).toISOString() });
    return;
  }

  if (urlPath === "/api/login" && method === "POST") {
    const ip = clientIp(req);
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.reset > now && attempt.count >= 8) {
      sendError(res, 429, "Terlalu banyak percobaan. Coba lagi dalam 10 menit.");
      return;
    }

    const body = await readJsonBody(req, 16 * 1024);
    if (!body.password || !passwordMatches(body.password)) {
      const entry = attempt && attempt.reset > now ? attempt : { count: 0, reset: now + 10 * 60 * 1000 };
      entry.count += 1;
      loginAttempts.set(ip, entry);
      sendError(res, 401, "Kata sandi salah.");
      return;
    }

    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { expires: Date.now() + SESSION_TTL_MS });
    res.setHeader("Set-Cookie", sessionCookie(req, token, Math.floor(SESSION_TTL_MS / 1000)));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/logout" && method === "POST") {
    const token = parseCookies(req.headers.cookie).admin_session;
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", sessionCookie(req, "", 0));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/admin/content") {
    if (!requireSession(req, res)) return;

    if (method === "GET") {
      try {
        const content = await readContent();
        sendJson(res, 200, { content });
      } catch {
        sendError(res, 500, "Konten belum tersedia. Pastikan content/site.json ada.");
      }
      return;
    }

    if (method === "PUT") {
      const body = await readJsonBody(req);
      const problem = validateContent(body);
      if (problem) {
        sendError(res, 400, problem);
        return;
      }
      await writeContent(body);
      sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    sendError(res, 405, "Metode tidak diizinkan.");
    return;
  }

  if (urlPath === "/api/admin/upload" && method === "POST") {
    if (!requireSession(req, res)) return;
    const result = await saveUpload(req);
    sendJson(res, 201, result);
    return;
  }

  sendError(res, 404, "Endpoint tidak ditemukan.");
}

/* ------------------------------------------------------------------ */
/* Server                                                             */
/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;

    if (urlPath.startsWith("/api/")) {
      if (req.method === "OPTIONS") {
        res.writeHead(204, securityHeaders());
        res.end();
        return;
      }
      await handleApi(req, res, urlPath);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendError(res, 405, "Metode tidak diizinkan.");
      return;
    }

    await serveStatic(req, res, urlPath);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status >= 500) console.error("[error]", error);
    if (!res.headersSent) {
      sendError(res, status, error instanceof HttpError ? error.message : "Terjadi kesalahan pada server.");
    } else {
      res.end();
    }
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expires < now) sessions.delete(token);
  }
  for (const [ip, attempt] of loginAttempts) {
    if (attempt.reset < now) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000).unref();

server.listen(PORT, HOST, () => {
  console.log(`\n  Klinik Aras — server berjalan`);
  console.log(`  Landing page : http://${HOST}:${PORT}/`);
  console.log(`  Admin panel  : http://${HOST}:${PORT}/admin/`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`  ⚠ ADMIN_PASSWORD belum diatur — memakai sandi default "admin123".`);
    console.warn(`    Jalankan: ADMIN_PASSWORD="sandi-anda" npm start\n`);
  } else {
    console.log(`  Autentikasi  : ADMIN_PASSWORD dari environment\n`);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} sudah dipakai. Jalankan dengan PORT lain, misalnya PORT=8081 npm start.`);
    process.exit(1);
  }
  throw error;
});
