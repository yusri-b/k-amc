/**
 * Seed konten awal ke Supabase dari content/site.json.
 *
 *   node --env-file=.env scripts/seed-supabase.mjs
 *   node --env-file=.env scripts/seed-supabase.mjs --force
 *
 * Tanpa --force, script berhenti bila Supabase sudah berisi konten.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getContentRow, upsertContent } from "../lib/supabase.js";
import { saveContent, validateContent } from "../lib/store.js";

const force = process.argv.includes("--force");

async function main() {
  const seedFile = path.join(process.cwd(), "content", "site.json");
  const raw = await fs.readFile(seedFile, "utf8");
  const data = JSON.parse(raw);

  const problem = validateContent(data);
  if (problem) throw new Error(`content/site.json tidak valid: ${problem}`);

  const existing = await getContentRow();
  if (existing && !force) {
    console.error(
      "Supabase sudah berisi konten. Jalankan dengan --force untuk menimpa (versi lama akan dicadangkan)."
    );
    process.exitCode = 1;
    return;
  }

  if (existing) {
    await saveContent(data);
    console.log("Konten diperbarui; versi sebelumnya masuk ke site_backups.");
  } else {
    await upsertContent(data);
    console.log("Seed selesai: konten awal tersimpan di site_content.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
