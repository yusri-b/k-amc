/**
 * Lapisan penyimpanan konten: Supabase sebagai sumber utama,
 * `content/site.json` sebagai seed dan fallback saat API/DB bermasalah.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "./http.js";
import {
  deleteBackups,
  getContentRow,
  insertBackup,
  listBackupIdsToPrune,
  upsertContent,
} from "./supabase.js";

export const REQUIRED_KEYS = [
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
  "footer",
];

const SEED_FILE = path.join(process.cwd(), "content", "site.json");

export function validateContent(data) {
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

export async function readSeedContent() {
  const raw = await fs.readFile(SEED_FILE, "utf8");
  return JSON.parse(raw);
}

/**
 * Untuk landing page: selalu berusaha menampilkan sesuatu.
 * Jika Supabase gagal, pakai salinan seed.
 */
export async function getPublicContent() {
  try {
    const row = await getContentRow();
    if (row && row.data) return row.data;
  } catch (error) {
    console.error("[store] gagal membaca Supabase, memakai seed:", error.message);
  }
  return readSeedContent();
}

/**
 * Untuk panel admin: error Supabase tidak disembunyikan agar admin
 * tidak menyimpan konten ke tempat yang salah.
 */
export async function getAdminContent() {
  const row = await getContentRow();
  if (row && row.data) return row.data;
  return readSeedContent();
}

export async function saveContent(content) {
  const problem = validateContent(content);
  if (problem) throw new HttpError(400, problem);

  const existing = await getContentRow();
  if (existing && existing.data) {
    await insertBackup(existing.data);
    try {
      const ids = await listBackupIdsToPrune();
      await deleteBackups(ids);
    } catch (error) {
      console.error("[store] gagal memangkas backup:", error.message);
    }
  }

  await upsertContent(content);
  return new Date().toISOString();
}
