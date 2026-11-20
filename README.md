# Klinik Aras Medical Center — Landing Page + Admin Panel

Landing page statis dengan **panel admin** untuk mengolah seluruh kontennya tanpa
menyentuh HTML. Dibangun dengan HTML + Tailwind CSS v4.

Produksi memakai **Vercel Functions + Supabase** (konten di Postgres, gambar di
Storage). Untuk pengembangan lokal atau VPS, tersedia juga `server.mjs` tanpa
dependensi runtime yang menyimpan konten di `content/site.json`.

## Menjalankan secara lokal (mode server Node)

```bash
npm install
ADMIN_PASSWORD="sandi-yang-kuat" npm start
```

Buka:

- Landing page — <http://127.0.0.1:8080/>
- Admin panel — <http://127.0.0.1:8080/admin/>

Jika `ADMIN_PASSWORD` tidak diatur, server memakai sandi default **`admin123`**
dan menampilkan peringatan di terminal. Selalu atur sandi sendiri sebelum
digunakan di server yang bisa diakses orang lain.

Opsi lain:

```bash
PORT=8081 npm start          # ganti port
HOST=0.0.0.0 npm start       # akses dari perangkat lain di jaringan lokal
```

> Sesi login disimpan di memori server. Restart server akan mengeluarkan semua
> sesi, tetapi konten tetap tersimpan di `content/site.json`. Mode ini tidak
> memakai Supabase.

Untuk menjalankan versi serverless (Vercel Functions) secara lokal, lihat
bagian **Deploy ke Vercel + Supabase**.

## Pengembangan

Tailwind memindai `index.html`, `admin/`, dan file JS untuk class yang dipakai.
Jalankan dua terminal:

```bash
npm run dev     # rebuild assets/tw.css saat class berubah (watch)
npm start       # server aplikasi + API
```

Build CSS produksi:

```bash
npm run build
```

## Struktur

```
index.html                 Halaman utama (copy awal tetap ada sebagai fallback)
src/input.css              Design token + komponen + utilitas admin
assets/tw.css              Hasil build Tailwind — jangan diedit manual
assets/content.js          Renderer: menarik konten dari API lalu mengisi halaman
assets/main.js             Interaksi: header, menu mobile, carousel, validasi form
admin/index.html           Shell panel admin (login + aplikasi)
admin/app.js               Form editor, daftar item, upload gambar, simpan
api/                       Route Vercel Functions (produksi)
lib/                       Auth, Supabase, penyimpanan konten, helper HTTP
supabase/schema.sql        Skema tabel + bucket Storage
scripts/seed-supabase.mjs  Seed konten awal ke Supabase
vercel.json                Konfigurasi build, region, dan CSP
server.mjs                 Server lokal/VPS (mode file, bukan Supabase)
content/site.json          Seed + fallback konten landing page
content/backups/           Cadangan lokal (mode server Node)
assets/img/uploads/        Upload lokal (mode server Node, dibuat saat dipakai)
assets/fonts/              Figtree + Noto Sans (self-hosted, .woff2)
assets/img/                Foto bawaan (WebP)
assets/favicon.svg         Favicon
```

## Panel admin

Masuk dengan kata sandi admin, lalu pilih bagian di sidebar:

| Bagian         | Yang dikelola                                                        |
| -------------- | -------------------------------------------------------------------- |
| Umum           | Title, meta description, Open Graph, identitas klinik, kontak        |
| Hero           | Label, judul, deskripsi, tombol, foto, kartu jam/rating, statistik   |
| Layanan        | Kartu layanan beserta ikon (tambah/hapus/urutkan)                    |
| Kenapa Kami    | Teks, foto, angka highlight, poin keunggulan                          |
| Dokter         | Foto, nama, spesialisasi, label, jadwal praktik                       |
| Alur Kunjungan | Langkah berobat (nomor urut otomatis)                                 |
| Testimoni      | Kutipan, nama, inisial, keterangan pada carousel                      |
| Janji Temu     | Teks panel CTA, poin benefit, pilihan layanan, pesan sukses           |
| Footer         | Tentang klinik, jam operasional, tautan layanan, hak cipta            |

Fitur editor:

- **Simpan eksplisit** — tombol `Simpan` atau `Ctrl/Cmd + S`. Status di header
  menunjukkan “Belum disimpan” selama ada perubahan.
- **Batalkan** — mengembalikan semua perubahan ke versi terakhir yang tersimpan.
- **Daftar berulang** — tambah, hapus, dan ubah urutan item (layanan, dokter,
  testimoni, jam operasional, dan lainnya). Jumlah kartu di landing page
  mengikuti jumlah item.
- **Upload gambar** — gambar diperkecil otomatis (maks. 1600 px) dan diubah ke
  WebP di browser sebelum diunggah. Format PNG/JPG/WebP/GIF, maks. **4 MB**
  (batas body Vercel Functions).
- **Logo klinik** — di bagian **Umum → Identitas Klinik**. Unggah logo PNG/WebP
  (latar transparan disarankan) atau isi URL gambar secara manual. Logo tampil di
  header dan footer landing page serta di sidebar panel admin. Jika kolom logo
  dikosongkan, tanda plus bawaan dipakai kembali. Nonaktifkan “Tampilkan nama
  klinik di samping logo” bila logo sudah memuat nama klinik (mis. logo panjang
  atau *wordmark*).
- **Pratinjau** — tombol “Lihat landing page” membuka situs di tab baru.
- **Cadangan otomatis** — di produksi, setiap penyimpanan menyalin versi
  sebelumnya ke tabel `site_backups` (20 cadangan terbaru). Di mode server Node,
  cadangan ditulis ke `content/backups/`.
- **Peringatan perubahan** — menutup tab dengan perubahan belum tersimpan akan
  memunculkan konfirmasi browser.

### Cara kerja konten

1. **Produksi (Vercel + Supabase):** admin menyimpan objek konten ke tabel
   `site_content` melalui `PUT /api/admin/content`.
2. **Mode lokal (server Node):** admin menyimpan ke `content/site.json`.
3. `assets/content.js` mengambil `GET /api/content` saat halaman dibuka.
4. Elemen di `index.html` ditandai dengan atribut seperti `data-cms="hero.title"`,
   `data-cms-list="services.items"`, dan `data-field="title"`; renderer mengisi
   teks, tautan, gambar, ikon, dan daftar berulang.
5. Jika API tidak tersedia, renderer memakai fallback `content/site.json`; jika
   keduanya tidak ada, salinan statis di HTML tetap tampil.

Catatan SEO: judul, meta description, dan Open Graph diperbarui oleh JavaScript.
Untuk kebutuhan SEO yang lebih ketat, tambahkan proses pra-render atau injeksi
meta di server sebelum halaman dikirim.

### API

| Metode & path              | Akses    | Fungsi                                    |
| -------------------------- | -------- | ----------------------------------------- |
| `GET /api/content`         | publik   | Konten landing page                       |
| `GET /api/admin/session`   | login    | Cek sesi aktif                            |
| `POST /api/login`          | publik   | Masuk (rate limit 8 percobaan / 10 menit) |
| `POST /api/logout`         | publik   | Keluar (hapus cookie sesi)                |
| `GET /api/admin/content`   | login    | Ambil konten untuk editor                 |
| `PUT /api/admin/content`   | login    | Simpan konten (validasi struktur)         |
| `POST /api/admin/upload`   | login    | Unggah gambar (validasi tipe & ukuran)    |

Autentikasi memakai cookie `HttpOnly` + `SameSite=Strict` + `Secure`, sandi
dibandingkan secara timing-safe, dan setiap penyimpanan divalidasi sebelum
ditulis. Di Vercel, sesi memakai token bertanda tangan HMAC (tanpa state) dan
rate limit login disimpan di Supabase. Upload dibatasi 4 MB agar sesuai limit
body Vercel Functions.

## Deploy ke Vercel + Supabase

### 1. Siapkan Supabase

1. Buat project di [supabase.com](https://supabase.com), pilih region
   **Southeast Asia (Singapore)**.
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`. Skrip ini membuat:
   - `site_content` (satu baris JSONB),
   - `site_backups` (riwayat 20 versi),
   - `login_attempts` (rate limit),
   - bucket Storage `clinic-uploads` (publik untuk dibaca, tulis via service role).
3. Catat **Project URL** dan **service_role key** dari
   **Settings → API**. Kunci service role hanya boleh berada di server/Vercel,
   jangan pernah dimasukkan ke `admin/app.js` atau `assets/`.

### 2. Environment variables

Salin `.env.example` menjadi `.env` untuk lokal, dan isi variabel yang sama di
**Vercel → Project → Settings → Environment Variables**:

| Variable | Keterangan |
| --- | --- |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (rahasia) |
| `SUPABASE_BUCKET` | opsional, default `clinic-uploads` |
| `ADMIN_PASSWORD` | sandi panel admin |
| `SESSION_SECRET` | string acak minimal 32 karakter |

### 3. Seed konten awal

```bash
node --env-file=.env scripts/seed-supabase.mjs
```

Tanpa `--force`, script berhenti bila Supabase sudah berisi konten. Gunakan
`--force` untuk menimpa; versi lama otomatis masuk ke `site_backups`.

### 4. Deploy ke Vercel

1. Push repo ke GitHub, lalu **Add New → Project** di Vercel dan impor repo.
2. Framework preset: **Other**. Build command dan output sudah diatur
   `vercel.json` (`npm run build`, output `.`), region fungsi `sin1`.
3. Tambahkan environment variables dari langkah 2, lalu deploy.
4. Buka **Settings → Domains** untuk memasang domain sendiri dan ikuti instruksi
   DNS dari Vercel (A/CNAME atau nameserver).
5. Uji `/admin/`, simpan konten, dan unggah gambar.

Catatan:
- `vercel.json` menyertakan `content/site.json` ke bundle fungsi sebagai fallback.
- CSP mengizinkan gambar dari `https://*.supabase.co`. Jika memakai custom domain
  Supabase, tambahkan domain tersebut ke `img-src` di `vercel.json`. URL gambar
  eksternal di luar domain yang diizinkan akan diblokir; unggah gambar lewat
  panel admin agar tersimpan di Supabase Storage.
- Paket Vercel **Hobby hanya untuk non-komersial**; situs klinik sebaiknya
  memakai Pro. Project Supabase Free akan pause setelah periode tidak aktif —
  gunakan Pro untuk produksi.

### 5. Menjalankan versi serverless secara lokal

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

`vercel dev` menjalankan static site + route `api/` dan memakai Supabase yang
sama. Mode `npm start` (server Node) tetap tersedia untuk pengembangan offline
dengan penyimpanan file lokal.

### 6. Backup produksi

- Aplikasi menyimpan 20 snapshot konten di `site_backups`.
- Aktifkan backup terjadwal Supabase (PITR pada paket berbayar) atau jalankan
  `pg_dump` berkala dari CI.
- Gambar tersimpan di Supabase Storage; unduh berkala bila perlu arsip lokal.

## Form janji temu

Form memvalidasi nama, nomor WhatsApp (format Indonesia), tanggal (tidak boleh
masa lalu), dan layanan. Saat gagal, muncul ringkasan error yang dapat difokus
dan field terkait diberi `aria-invalid` + pesan inline.

**Saat valid, form membuka WhatsApp dengan pesan yang sudah terisi** (nama,
nomor WhatsApp, tanggal kunjungan, dan layanan) ke nomor pada pengaturan
**Umum → Kontak → Nomor telepon (tautan)**. Nomor `0812…` otomatis diubah ke
format internasional `62…`. Tab WhatsApp dibuka lewat `window.open`; jika
diblokir browser, tersedia tombol **Buka WhatsApp** di kotak sukses.

Logika ada di `assets/main.js` (`buildWhatsappUrl()`), memakai nomor dari
`contact.phoneHref` yang dimuat oleh `assets/content.js`.

Form ini tidak menyimpan permintaan ke backend. Bila perlu pencatatan server,
tambahkan pemanggilan API sebelum membuka WhatsApp, misalnya:

```js
const data = Object.fromEntries(new FormData(form));
await fetch("/api/appointment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

## Aksesibilitas

Landing page sudah diuji dengan axe-core (WCAG 2.1 AA): tanpa pelanggaran.

- Skip link, focus ring terlihat, urutan tab logis
- Carousel: prev/next, indikator, jeda otomatis, `aria-live`, berhenti saat
  hover/focus, mendukung `ArrowLeft`/`ArrowRight`
- Semua animasi dinonaktifkan pada `prefers-reduced-motion: reduce`
- Kontras teks minimal 4.5:1
- Admin: setiap input punya label, tombol ikon punya `aria-label`, status
  simpan dan notifikasi diumumkan lewat `aria-live`, navigasi dapat dipakai
  dengan keyboard, dan layout responsif dengan sidebar geser di layar kecil

## Data contoh yang perlu diganti

- **Foto dokter** (`assets/img/doctor-*.webp`, `hero-doctor.webp`,
  `consult.webp`) masih foto stok. Ganti dengan foto asli klinik lewat admin.
- Nama dokter, jadwal praktik, testimoni pasien
- Alamat, nomor telepon, email
- Jam operasional, statistik, rating
- URL domain & metadata Open Graph

## Palet warna

| Token              | Nilai     | Pemakaian                        |
| ------------------ | --------- | -------------------------------- |
| `--color-primary`  | `#0E7490` | Aksen utama, tautan, ikon        |
| `--color-accent`   | `#047857` | Tombol CTA utama                 |
| `--color-ink`      | `#164E63` | Judul, panel CTA gelap, sidebar  |
| `--color-body`     | `#475569` | Teks isi                         |
| `--color-surface`  | `#ECFEFF` | Latar halaman                    |
| `--color-card`     | `#FFFFFF` | Kartu & permukaan                |

Tipografi: **Figtree** (judul) + **Noto Sans** (isi).

## Catatan produksi

**Mode Vercel + Supabase**

- HTTPS dan domain ditangani Vercel.
- Jaga kerahasiaan `SUPABASE_SERVICE_ROLE_KEY` dan `SESSION_SECRET`; jangan
  pernah menaruhnya di file klien.
- Gunakan `ADMIN_PASSWORD` yang kuat dan acak.
- Aktifkan backup Supabase; tabel `site_backups` bukan pengganti backup database.
- Pantau kuota Storage dan limit 4 MB per upload.
- Pertimbangkan Vercel WAF/Cloudflare Access untuk membatasi `/admin/`.

**Mode server Node (lokal/VPS)**

- Jalankan di balik HTTPS (reverse proxy) dan set `ADMIN_PASSWORD` yang kuat.
- Jangan menyajikan direktori proyek mentah dengan web server statis: panel admin
  membutuhkan `server.mjs`. Server hanya mengekspos `index.html`, `admin/`, dan
  `assets/`, serta menolak akses ke `content/`, `server.mjs`, dan `package.json`.
- Cadangkan `content/site.json` dan `assets/img/uploads/` secara berkala.
- `npm start` mengikat ke `127.0.0.1` secara default. Gunakan `HOST=0.0.0.0`
  hanya bila benar-benar diperlukan dan sudah dilindungi firewall/proxy.
