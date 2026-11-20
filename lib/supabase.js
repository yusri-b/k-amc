/**
 * Klien tipis Supabase (PostgREST + Storage) memakai `fetch`.
 * Hanya dipakai di server/route API — kunci service role tidak boleh
 * pernah dikirim ke browser.
 */
import crypto from "node:crypto";
import { HttpError } from "./http.js";
import { mimeForImage } from "./images.js";

const REQUEST_TIMEOUT_MS = 15_000;
const STORAGE_TIMEOUT_MS = 30_000;

export const MAX_BACKUPS = 20;
export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const MAX_LOGIN_ATTEMPTS = 8;

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new HttpError(500, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur.");
  }
  return { url, key };
}

function bucketName() {
  return process.env.SUPABASE_BUCKET || "clinic-uploads";
}

async function request(pathname, { method = "GET", body, prefer, headers = {} } = {}) {
  const { url, key } = config();
  const hasBody = body !== undefined;
  let response;
  try {
    response = await fetch(`${url}${pathname}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[supabase] koneksi gagal", error.message);
    throw new HttpError(502, "Tidak dapat terhubung ke Supabase.");
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object"
        ? data.message || data.error_description || data.error
        : text;
    console.error("[supabase]", method, pathname, response.status, detail);
    throw new HttpError(502, `Supabase menolak permintaan (${response.status}).`);
  }

  return { data, headers: response.headers };
}

/* ------------------------------------------------------------------ */
/* Konten & backup                                                    */
/* ------------------------------------------------------------------ */

export async function getContentRow() {
  const { data } = await request("/rest/v1/site_content?id=eq.main&select=data,updated_at");
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
}

export async function upsertContent(content) {
  await request("/rest/v1/site_content?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      id: "main",
      data: content,
      updated_at: new Date().toISOString(),
    },
  });
}

export async function insertBackup(content) {
  await request("/rest/v1/site_backups", {
    method: "POST",
    prefer: "return=minimal",
    body: { data: content },
  });
}

export async function listBackupIdsToPrune() {
  const { data } = await request(
    `/rest/v1/site_backups?select=id&order=created_at.desc&offset=${MAX_BACKUPS}`
  );
  return Array.isArray(data) ? data.map((row) => row.id) : [];
}

export async function deleteBackups(ids) {
  if (!ids.length) return;
  const list = ids.map((id) => Number(id)).filter(Number.isFinite).join(",");
  if (!list) return;
  await request(`/rest/v1/site_backups?id=in.(${list})`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

/* ------------------------------------------------------------------ */
/* Rate limit login                                                   */
/* ------------------------------------------------------------------ */

export async function countRecentLoginAttempts(ip) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const { headers } = await request(
    `/rest/v1/login_attempts?select=id&ip=eq.${encodeURIComponent(ip)}&attempted_at=gte.${encodeURIComponent(since)}&limit=1`,
    { prefer: "count=exact" }
  );
  const range = headers.get("content-range") || "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function recordLoginAttempt(ip) {
  await request("/rest/v1/login_attempts", {
    method: "POST",
    prefer: "return=minimal",
    body: { ip },
  });
}

export async function clearLoginAttempts(ip) {
  await request(`/rest/v1/login_attempts?ip=eq.${encodeURIComponent(ip)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

/** Bersihkan catatan percobaan lama; kegagalan diabaikan. */
export async function pruneLoginAttempts() {
  const before = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await request(`/rest/v1/login_attempts?attempted_at=lt.${encodeURIComponent(before)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

/* ------------------------------------------------------------------ */
/* Storage gambar                                                     */
/* ------------------------------------------------------------------ */

export async function uploadImage(buffer, type) {
  const { url, key } = config();
  const bucket = bucketName();
  const name = `upload-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${type}`;

  const response = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": mimeForImage(type),
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "false",
    },
    body: buffer,
    signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
  }).catch((error) => {
    console.error("[storage] koneksi gagal", error.message);
    throw new HttpError(502, "Tidak dapat terhubung ke Supabase Storage.");
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[storage]", response.status, text);
    throw new HttpError(502, "Gagal mengunggah gambar ke Supabase Storage.");
  }

  return {
    url: `${url}/storage/v1/object/public/${bucket}/${name}`,
    name,
    bytes: buffer.length,
    type,
  };
}
