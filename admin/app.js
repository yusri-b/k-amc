/**
 * Klinik Aras — admin panel.
 * Zero dependencies. Talks to the tiny JSON API in server.mjs.
 */
(() => {
  "use strict";

  const API = {
    session: "/api/admin/session",
    login: "/api/login",
    logout: "/api/logout",
    content: "/api/admin/content",
    upload: "/api/admin/upload"
  };

  const ICONS = {
    heart: '<path d="M12 21s-7.5-4.6-9.5-9.1C1 8 3 5 6.5 5c2 0 3.6 1.2 4.5 2.5.9-1.3 2.5-2.5 4.5-2.5C19 5 21 8 20.5 11.9 19.5 16.4 12 21 12 21z" />',
    child: '<circle cx="9" cy="7" r="3" /><path d="M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" /><path d="M16 3.5c1.2.5 2 1.7 2 3M19.5 2c1.8 1 3 2.9 3 5" />',
    female: '<circle cx="12" cy="6" r="3" /><circle cx="5.5" cy="15.5" r="2.5" /><circle cx="18.5" cy="15.5" r="2.5" /><path d="M12 9v3m0 0-4.3 2.4M15 12l3.1 2M12 12l4.3 2.4M12 12l-4.3 2.4" />',
    "heart-pulse": '<path d="M12 21s-7.5-4.6-9.5-9.1C1 8 3 5 6.5 5c2 0 3.6 1.2 4.5 2.5.9-1.3 2.5-2.5 4.5-2.5C19 5 21 8 20.5 11.9 19.5 16.4 12 21 12 21z" /><path d="M4.5 12h4l1.5-3 2.5 6 1.5-3h5.5" />',
    lab: '<path d="M9 2v6l-5.3 8.6A3 3 0 0 0 6.3 21h11.4a3 3 0 0 0 2.6-4.4L15 8V2" /><path d="M7 2h10M8 15h8" />',
    checkup: '<path d="M20 12a8 8 0 1 0-16 0v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6z" /><path d="M8 12h8M12 8v8" />',
    stethoscope: '<path d="M4 3v6a5 5 0 0 0 10 0V3" /><path d="M4 3h3M11 3h3" /><path d="M9 14v2a5 5 0 0 0 10 0v-2" /><circle cx="19" cy="11" r="2" />',
    tooth: '<path d="M12 5.5C10.5 4 8.5 3 7 3 4.8 3 3 5 3 7.5c0 1.6.5 2.8.9 4.3.4 1.6.4 3.2.7 4.7.2 1 .6 2 1.4 2 1 0 1.3-1.2 1.5-2.4.2-1.5.4-3 2.5-3s2.3 1.5 2.5 3c.2 1.2.5 2.4 1.5 2.4.8 0 1.2-1 1.4-2 .3-1.5.3-3.1.7-4.7.4-1.5.9-2.7.9-4.3C21 5 19.2 3 17 3c-1.5 0-3.5 1-5 2.5z" />',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />',
    bone: '<path d="M6.5 6.5a3 3 0 0 0-4 4c.4.4.9.6 1.4.7l.6 1.4c-.2.5-.1 1 .2 1.5a3 3 0 1 0 4-4c-.4-.4-.9-.6-1.4-.7l-.6-1.4c.2-.5.1-1-.2-1.5z" /><path d="M17.5 17.5a3 3 0 0 0 4-4c-.4-.4-.9-.6-1.4-.7l-.6-1.4c.2-.5.1-1-.2-1.5a3 3 0 1 0-4 4c.4.4.9.6 1.4.7l.6 1.4c-.2.5-.1 1 .2 1.5z" /><path d="M9 15 15 9" />',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4" />',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" /><path d="M9 12l2 2 4-4" />'
  };

  const ICON_OPTIONS = [
    ["heart", "Hati / umum"],
    ["child", "Kesehatan anak"],
    ["female", "Kesehatan wanita"],
    ["heart-pulse", "Jantung"],
    ["lab", "Laboratorium"],
    ["checkup", "Medical check-up"],
    ["stethoscope", "Stetoskop"],
    ["tooth", "Gigi"],
    ["eye", "Mata"],
    ["bone", "Tulang"],
    ["activity", "Aktivitas"],
    ["shield", "Perlindungan"]
  ];

  const text = (path, label, opts = {}) => ({ path, label, type: "text", ...opts });
  const area = (path, label, opts = {}) => ({ path, label, type: "textarea", ...opts });
  const image = (path, label, opts = {}) => ({ path, label, type: "image", ...opts });
  const toggle = (path, label, opts = {}) => ({ path, label, type: "toggle", ...opts });
  const icon = (path, label, opts = {}) => ({ path, label, type: "icon", ...opts });
  const group = (label) => ({ type: "group", label });
  const list = (path, label, fields, opts = {}) => ({ path, label, type: "list", fields, ...opts });

  const SECTIONS = [
    {
      id: "umum",
      nav: "Umum",
      title: "Pengaturan Umum",
      description: "Metadata halaman, identitas klinik, dan informasi kontak yang dipakai di seluruh halaman.",
      icon: "settings",
      fields: [
        group("SEO & Media Sosial"),
        text("meta.title", "Judul halaman (title tag)", { hint: "Tampil di tab browser dan hasil pencarian. Idealnya di bawah 60 karakter." }),
        area("meta.description", "Meta description", { hint: "Ringkasan untuk mesin pencari. Idealnya 140–160 karakter." }),
        text("meta.ogTitle", "Judul Open Graph", { hint: "Dipakai saat tautan dibagikan di WhatsApp dan media sosial." }),
        area("meta.ogDescription", "Deskripsi Open Graph"),
        group("Identitas Klinik"),
        text("brand.name", "Nama klinik"),
        text("brand.tagline", "Tagline"),
        image("brand.logo", "Logo klinik", {
          contain: true,
          hint: "Unggah logo PNG/WebP (latar transparan disarankan). Jika kosong, tanda plus bawaan tetap dipakai."
        }),
        text("brand.logoAlt", "Teks alternatif logo", {
          hint: "Dibaca pembaca layar. Kosongkan untuk memakai nama klinik."
        }),
        toggle("brand.showText", "Tampilkan nama klinik di samping logo", {
          default: true,
          hint: "Matikan jika logo sudah memuat nama klinik."
        }),
        group("Kontak"),
        text("contact.phoneDisplay", "Nomor telepon (tampilan)", { hint: "Contoh: (0812) 3456-7890" }),
        text("contact.phoneHref", "Nomor telepon (tautan)", { hint: "Format internasional untuk tombol telepon dan tujuan WhatsApp janji temu, contoh: +6281234567890" }),
        text("contact.email", "Email"),
        text("contact.address", "Alamat")
      ]
    },
    {
      id: "hero",
      nav: "Hero",
      title: "Bagian Hero",
      description: "Tayangan pertama yang dilihat pengunjung: judul, ajakan bertindak, foto, dan angka kepercayaan.",
      icon: "hero",
      fields: [
        group("Teks Utama"),
        text("hero.badge", "Label kecil di atas judul"),
        text("hero.titleLead", "Judul — bagian awal"),
        text("hero.titleHighlight", "Judul — bagian disorot", { hint: "Ditampilkan dengan warna primer." }),
        area("hero.description", "Deskripsi"),
        group("Tombol Ajakan"),
        text("hero.primaryCta.label", "Label tombol utama"),
        text("hero.primaryCta.href", "Tautan tombol utama"),
        text("hero.secondaryCta.label", "Label tombol kedua"),
        text("hero.secondaryCta.href", "Tautan tombol kedua"),
        group("Foto Hero"),
        image("hero.image", "Gambar"),
        text("hero.imageAlt", "Teks alternatif gambar", { hint: "Penting untuk aksesibilitas dan SEO. Jelaskan isi gambar." }),
        group("Kartu Mengambang"),
        text("hero.opening.title", "Kartu jam — judul"),
        text("hero.opening.hours", "Kartu jam — jam"),
        text("hero.rating.score", "Kartu rating — nilai"),
        text("hero.rating.reviews", "Kartu rating — keterangan"),
        group("Statistik Kepercayaan"),
        list("hero.stats", "Statistik", [
          text("value", "Angka", { half: true }),
          text("suffix", "Akhiran", { half: true, hint: "Contoh: +, rb, /5" }),
          text("label", "Keterangan")
        ], { itemLabel: "Statistik", addLabel: "Tambah statistik", hint: "Tampil sebagai tiga kolom di bawah tombol. Disarankan 3 item." })
      ]
    },
    {
      id: "layanan",
      nav: "Layanan",
      title: "Layanan",
      description: "Kartu pilar layanan. Jumlah kartu mengikuti jumlah item dan otomatis menyesuaikan tata letak.",
      icon: "services",
      fields: [
        text("services.eyebrow", "Label section"),
        text("services.title", "Judul section"),
        area("services.description", "Deskripsi section"),
        list("services.items", "Daftar layanan", [
          icon("icon", "Ikon"),
          text("title", "Nama layanan"),
          area("description", "Deskripsi")
        ], { itemLabel: "Layanan", addLabel: "Tambah layanan", hint: "Kartu menyesuaikan jumlah item. Pilihan dropdown pada form janji temu diatur terpisah di bagian Janji Temu." })
      ]
    },
    {
      id: "kenapa",
      nav: "Kenapa Kami",
      title: "Kenapa Kami",
      description: "Alasan pasien memilih klinik Anda, beserta foto pendukung dan satu angka highlight.",
      icon: "why",
      fields: [
        text("why.eyebrow", "Label section"),
        text("why.title", "Judul section"),
        area("why.description", "Deskripsi section"),
        image("why.image", "Gambar"),
        text("why.imageAlt", "Teks alternatif gambar"),
        group("Kartu Highlight"),
        text("why.highlight.value", "Angka highlight", { hint: "Contoh: 98%" }),
        text("why.highlight.label", "Keterangan highlight"),
        group("Poin Keunggulan"),
        list("why.items", "Keunggulan", [
          text("title", "Judul"),
          area("description", "Deskripsi")
        ], { itemLabel: "Keunggulan", addLabel: "Tambah keunggulan" })
      ]
    },
    {
      id: "dokter",
      nav: "Dokter",
      title: "Tim Dokter",
      description: "Profil dokter yang tampil di landing page, lengkap dengan jadwal praktik.",
      icon: "doctors",
      fields: [
        text("doctors.eyebrow", "Label section"),
        text("doctors.title", "Judul section"),
        area("doctors.description", "Deskripsi section"),
        list("doctors.items", "Dokter", [
          image("image", "Foto dokter"),
          text("imageAlt", "Teks alternatif foto"),
          text("name", "Nama lengkap", { half: true }),
          text("badge", "Label spesialisasi", { half: true }),
          text("specialty", "Jabatan / spesialisasi"),
          text("schedule", "Jadwal praktik", { hint: "Contoh: Senin, Rabu, Jumat — 09.00–14.00" })
        ], { itemLabel: "Dokter", addLabel: "Tambah dokter", hint: "Gunakan foto potret dengan rasio 4:5 agar tampilan konsisten." })
      ]
    },
    {
      id: "alur",
      nav: "Alur Kunjungan",
      title: "Alur Kunjungan",
      description: "Langkah-langkah berobat. Nomor urut dihitung otomatis dari urutan item.",
      icon: "steps",
      fields: [
        text("steps.eyebrow", "Label section"),
        text("steps.title", "Judul section"),
        area("steps.description", "Deskripsi section"),
        list("steps.items", "Langkah", [
          text("title", "Judul langkah"),
          area("description", "Deskripsi")
        ], { itemLabel: "Langkah", addLabel: "Tambah langkah", hint: "Disarankan 3 langkah agar sesuai tata letak tiga kolom." })
      ]
    },
    {
      id: "testimoni",
      nav: "Testimoni",
      title: "Testimoni",
      description: "Cerita pasien pada carousel. Item pertama tampil lebih dulu dan carousel berputar otomatis.",
      icon: "quote",
      fields: [
        text("testimonials.eyebrow", "Label section"),
        text("testimonials.title", "Judul section"),
        list("testimonials.items", "Testimoni", [
          area("quote", "Kutipan"),
          text("name", "Nama pasien", { half: true }),
          text("initials", "Inisial", { half: true, hint: "2 huruf untuk avatar, contoh: SW" }),
          text("role", "Keterangan")
        ], { itemLabel: "Testimoni", addLabel: "Tambah testimoni" })
      ]
    },
    {
      id: "janji",
      nav: "Janji Temu",
      title: "Janji Temu",
      description: "Teks pada panel CTA dan opsi layanan yang bisa dipilih pasien di form.",
      icon: "calendar",
      fields: [
        text("appointment.eyebrow", "Label section"),
        text("appointment.title", "Judul section"),
        area("appointment.description", "Deskripsi"),
        list("appointment.benefits", "Poin benefit", [
          text("text", "Teks")
        ], { itemLabel: "Benefit", addLabel: "Tambah benefit" }),
        list("appointment.serviceOptions", "Pilihan layanan", [
          text("label", "Nama layanan", { half: true }),
          text("value", "Nilai", { half: true, hint: "Huruf kecil tanpa spasi, contoh: poliklinik-umum" })
        ], { itemLabel: "Pilihan", addLabel: "Tambah pilihan", hint: "Daftar ini mengisi dropdown “Layanan” pada form janji temu." }),
        group("Form & Pesan Sukses"),
        text("appointment.submitLabel", "Label tombol kirim"),
        area("appointment.privacyNote", "Catatan privasi"),
        text("appointment.successTitle", "Judul pesan sukses"),
        area("appointment.successMessage", "Isi pesan sukses")
      ]
    },
    {
      id: "footer",
      nav: "Footer",
      title: "Footer",
      description: "Informasi pada bagian bawah halaman: tentang klinik, jam operasional, dan tautan layanan.",
      icon: "footer",
      fields: [
        area("footer.about", "Tentang klinik"),
        text("footer.copyrightName", "Nama pada hak cipta"),
        area("footer.hoursNote", "Catatan jam operasional"),
        list("footer.hours", "Jam operasional", [
          text("day", "Hari", { half: true }),
          text("time", "Jam", { half: true, hint: "Contoh: 08.00 – 21.00" })
        ], { itemLabel: "Baris jam", addLabel: "Tambah baris" }),
        list("footer.serviceLinks", "Tautan layanan", [
          text("label", "Label", { half: true }),
          text("href", "Tautan", { half: true, hint: "Contoh: #layanan" })
        ], { itemLabel: "Tautan", addLabel: "Tambah tautan" })
      ]
    }
  ];

  const NAV_ICONS = {
    settings:
      '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.6.64 1.03 1.25 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />',
    hero: '<path d="M3 3h18v18H3z" /><path d="M3 9h18M9 21V9" />',
    services: '<path d="M12 21s-7.5-4.6-9.5-9.1C1 8 3 5 6.5 5c2 0 3.6 1.2 4.5 2.5.9-1.3 2.5-2.5 4.5-2.5C19 5 21 8 20.5 11.9 19.5 16.4 12 21 12 21z" />',
    why: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" /><path d="M9 12l2 2 4-4" />',
    doctors: '<circle cx="9" cy="8" r="3.5" /><path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14h3A5.5 5.5 0 0 1 16 19.5V21" /><path d="M17 4.5a3.5 3.5 0 0 1 0 7M19 14.5a4 4 0 0 1 3 3.9V21" />',
    steps: '<path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />',
    quote: '<path d="M7 7H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v3a2 2 0 0 1-2 2M20 7h-3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v3a2 2 0 0 1-2 2" />',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16h6" />',
    footer:
      '<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15h18M8 18h2M12 18h4" />'
  };

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */

  let content = null;
  let baseline = null;
  let currentId = SECTIONS[0].id;
  let dirty = false;
  let saving = false;
  let uid = 0;

  const $ = (selector) => document.querySelector(selector);
  const loginView = $("#login-view");
  const appView = $("#app-view");
  const sidebar = $("#sidebar");
  const overlay = $("#sidebar-overlay");
  const nav = $("#admin-nav");
  const form = $("#editor-form");
  const fieldsWrap = $("#editor-fields");
  const saveBtn = $("#save-btn");
  const saveLabel = $("#save-label");
  const discardBtn = $("#discard-btn");
  const statusPill = $("#save-status");
  const statusDot = $("#save-dot");
  const statusText = $("#save-status-text");

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  const getPath = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

  const setPath = (obj, path, value) => {
    const keys = path.split(".");
    const last = keys.pop();
    let target = obj;
    keys.forEach((key) => {
      if (typeof target[key] !== "object" || target[key] === null) target[key] = {};
      target = target[key];
    });
    target[last] = value;
  };

  const nextId = () => `field-${++uid}`;

  const resolvePreviewSrc = (src) => {
    if (!src) return "";
    if (/^(https?:|data:|blob:|\/)/i.test(src)) return src;
    return `/${src.replace(/^\.?\//, "")}`;
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { Accept: "application/json", ...(options.headers || {}) }
    });
    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await response.json().catch(() => ({})) : {};
    if (!response.ok) {
      const error = new Error(data.error || `Permintaan gagal (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function toast(message, type = "success") {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    const palette =
      type === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : type === "info"
          ? "border-hairline bg-card text-ink"
          : "border-accent/20 bg-accent/10 text-accent-dark";
    el.className = `pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lift ${palette}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 200ms ease, transform 200ms ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  function setStatus() {
    statusPill.className = dirty
      ? "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
      : "inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent";
    statusDot.className = `size-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-accent"}`;
    statusText.textContent = dirty ? "Belum disimpan" : "Tersimpan";

    const disabled = !dirty || saving;
    saveBtn.disabled = disabled;
    discardBtn.disabled = disabled;
    form.querySelectorAll(".discard-inline, button[type='submit']").forEach((btn) => {
      btn.disabled = disabled;
    });
    saveLabel.textContent = saving ? "Menyimpan…" : "Simpan";
    document.title = `${dirty ? "• " : ""}Admin — Klinik Aras Medical Center`;
  }

  function markDirty() {
    const next = JSON.stringify(content) !== JSON.stringify(baseline);
    if (next !== dirty) {
      dirty = next;
      setStatus();
    }
  }

  function clone(value) {
    return typeof structuredClone === "function"
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                         */
  /* ------------------------------------------------------------------ */

  function buildNav() {
    nav.innerHTML = "";
    SECTIONS.forEach((section) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-nav-item";
      button.dataset.section = section.id;
      button.innerHTML = `<svg class="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICONS[section.icon] || ""}</svg><span class="flex-1">${section.nav}</span>`;
      button.addEventListener("click", () => showSection(section.id));
      nav.appendChild(button);
    });
  }

  function highlightNav() {
    nav.querySelectorAll("[data-section]").forEach((button) => {
      const active = button.dataset.section === currentId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function showSection(id, options = {}) {
    const section = SECTIONS.find((item) => item.id === id) || SECTIONS[0];
    currentId = section.id;
    $("#page-title").textContent = section.title;
    $("#page-subtitle").textContent = section.description;
    highlightNav();
    if (!options.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
    renderSection(section);
    closeSidebar();
  }

  /* ------------------------------------------------------------------ */
  /* Field rendering                                                    */
  /* ------------------------------------------------------------------ */

  function fieldHint(field) {
    if (!field.hint) return null;
    const hint = document.createElement("p");
    hint.className = "admin-hint";
    hint.textContent = field.hint;
    return hint;
  }

  function baseWrapper(field, control, extraClass = "") {
    const wrapper = document.createElement("div");
    if (extraClass) wrapper.className = extraClass;
    const label = document.createElement("label");
    label.className = "admin-label";
    label.htmlFor = control.id;
    label.textContent = field.label;
    wrapper.append(label, control);
    const hint = fieldHint(field);
    if (hint) wrapper.appendChild(hint);
    return wrapper;
  }

  function renderText(field, item) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = nextId();
    input.className = "admin-input";
    input.value = getPath(item, field.path) ?? "";
    input.addEventListener("input", () => {
      setPath(item, field.path, input.value);
      markDirty();
    });
    return { element: baseWrapper(field, input) };
  }

  function renderTextarea(field, item) {
    const textarea = document.createElement("textarea");
    textarea.id = nextId();
    textarea.className = "admin-textarea";
    textarea.rows = 3;
    textarea.value = getPath(item, field.path) ?? "";
    textarea.addEventListener("input", () => {
      setPath(item, field.path, textarea.value);
      autoGrowTextarea(textarea);
      markDirty();
    });
    return { element: baseWrapper(field, textarea) };
  }

  function autoGrowTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 96), 320)}px`;
  }

  function renderIcon(field, item) {
    const row = document.createElement("div");
    row.className = "flex items-center gap-3";

    const preview = document.createElement("span");
    preview.className = "grid size-10 shrink-0 place-items-center rounded-xl border border-hairline bg-primary/5 text-primary";
    preview.setAttribute("aria-hidden", "true");

    const select = document.createElement("select");
    select.id = nextId();
    select.className = "admin-input";
    ICON_OPTIONS.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = getPath(item, field.path) || "heart";

    const paint = () => {
      preview.innerHTML = `<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[select.value] || ""}</svg>`;
    };
    paint();
    select.addEventListener("change", () => {
      setPath(item, field.path, select.value);
      paint();
      markDirty();
    });

    row.append(preview, select);
    return { element: baseWrapper(field, row) };
  }

  function renderImage(field, item) {
    const wrapper = document.createElement("div");

    const label = document.createElement("label");
    label.className = "admin-label";
    label.textContent = field.label;

    const row = document.createElement("div");
    row.className = "flex flex-col gap-3 sm:flex-row sm:items-start";

    const previewBox = document.createElement("div");
    previewBox.className = "grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-hairline bg-surface text-center sm:w-32";
    const preview = document.createElement("img");
    preview.className = field.contain ? "size-full object-contain p-2" : "size-full object-cover";
    preview.alt = "";
    const empty = document.createElement("span");
    empty.className = "px-2 text-[11px] text-body";
    empty.textContent = "Belum ada gambar";
    previewBox.append(preview, empty);

    const controls = document.createElement("div");
    controls.className = "grid min-w-0 flex-1 gap-2";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.id = nextId();
    urlInput.className = "admin-input";
    urlInput.placeholder = "assets/img/contoh.webp";
    urlInput.value = getPath(item, field.path) ?? "";
    label.htmlFor = urlInput.id;

    const actions = document.createElement("div");
    actions.className = "flex flex-wrap items-center gap-2";

    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.className = "admin-btn-ghost !px-3 !py-2 text-xs";
    uploadBtn.textContent = "Unggah gambar";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
    fileInput.className = "hidden";

    const meta = document.createElement("span");
    meta.className = "text-[11px] text-body";
    meta.textContent = "WebP/PNG/JPG · maks. 4 MB";

    const paint = () => {
      const src = urlInput.value.trim();
      preview.hidden = !src;
      empty.hidden = Boolean(src);
      if (src) preview.src = resolvePreviewSrc(src);
      else preview.removeAttribute("src");
    };

    urlInput.addEventListener("input", () => {
      setPath(item, field.path, urlInput.value);
      paint();
      markDirty();
    });

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const original = uploadBtn.textContent;
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Mengunggah…";
      try {
        const blob = await prepareUpload(file);
        const result = await api(API.upload, {
          method: "POST",
          headers: { "Content-Type": blob.type || "application/octet-stream", "X-Filename": file.name },
          body: blob
        });
        urlInput.value = result.url;
        setPath(item, field.path, result.url);
        paint();
        markDirty();
        toast("Gambar berhasil diunggah.");
      } catch (error) {
        toast(error.message || "Gagal mengunggah gambar.", "error");
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = original;
        fileInput.value = "";
      }
    });

    actions.append(uploadBtn, fileInput, meta);
    controls.append(urlInput, actions);
    row.append(previewBox, controls);
    wrapper.append(label, row);
    const hint = fieldHint(field);
    if (hint) wrapper.appendChild(hint);

    paint();
    return { element: wrapper };
  }

  async function prepareUpload(file) {
    if (!file.type.startsWith("image/")) throw new Error("Berkas harus berupa gambar.");
    if (file.size > 4 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 4 MB.");

    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
      if (blob) return blob;
    } catch {
      /* fall through to the original file */
    }
    return file;
  }

  function renderToggle(field, item) {
    const label = document.createElement("label");
    label.className = "flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface/60 px-4 py-3";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = nextId();
    input.className = "admin-toggle mt-0.5 size-4.5 shrink-0 cursor-pointer accent-primary";
    input.checked = (getPath(item, field.path) ?? field.default ?? false) !== false;

    const textWrap = document.createElement("span");
    textWrap.className = "grid gap-0.5";
    const title = document.createElement("span");
    title.className = "text-sm font-semibold text-ink";
    title.textContent = field.label;
    textWrap.appendChild(title);
    const hint = fieldHint(field);
    if (hint) {
      const span = document.createElement("span");
      span.className = "admin-hint !mt-0";
      span.textContent = field.hint;
      textWrap.appendChild(span);
    }

    input.addEventListener("change", () => {
      setPath(item, field.path, input.checked);
      markDirty();
    });

    label.append(input, textWrap);
    const wrapper = document.createElement("div");
    wrapper.appendChild(label);
    return { element: wrapper };
  }

  function renderControl(field, item) {
    switch (field.type) {
      case "img":
      case "image":
        return renderImage(field, item);
      case "icon":
        return renderIcon(field, item);
      case "textarea":
        return renderTextarea(field, item);
      case "toggle":
        return renderToggle(field, item);
      default:
        return renderText(field, item);
    }
  }

  function blankItem(fields) {
    const item = {};
    fields.forEach((field) => {
      if (field.type === "group") return;
      if (field.type === "icon") item[field.path] = "heart";
      else if (field.type === "toggle") item[field.path] = field.default ?? false;
      else item[field.path] = "";
    });
    return item;
  }

  function summaryValue(item, fields, index, itemLabel) {
    const key = fields.find(
      (field) =>
        ["title", "name", "label", "day", "value", "text"].includes(field.path) &&
        typeof item[field.path] === "string" &&
        item[field.path].trim()
    );
    return key ? item[key.path] : `${itemLabel} ${index + 1}`;
  }

  function renderListField(field, basePath) {
    const items = getPath(content, field.path);
    if (!Array.isArray(items)) {
      setPath(content, field.path, []);
      return renderListField(field, basePath);
    }

    const wrap = document.createElement("div");
    wrap.className = "grid gap-3 rounded-2xl border border-hairline bg-card p-4 sm:p-5";

    const header = document.createElement("div");
    header.className = "flex flex-wrap items-center justify-between gap-2";

    const headingWrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.className = "text-sm font-bold text-ink";
    heading.textContent = field.label;
    const count = document.createElement("p");
    count.className = "text-xs";
    count.textContent = `${items.length} item`;
    headingWrap.append(heading, count);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "admin-btn-ghost !px-3 !py-2 text-xs";
    addBtn.textContent = `+ ${field.addLabel || "Tambah item"}`;
    addBtn.addEventListener("click", () => {
      items.push(blankItem(field.fields));
      renderSection(SECTIONS.find((section) => section.id === currentId));
      markDirty();

      const cards = fieldsWrap.querySelectorAll(".admin-item-card");
      const lastCard = cards[cards.length - 1];
      if (lastCard) {
        lastCard.scrollIntoView({ behavior: "smooth", block: "center" });
        lastCard.querySelector("input, textarea, select")?.focus({ preventScroll: true });
      }
    });

    header.append(headingWrap, addBtn);
    wrap.appendChild(header);

    const hint = fieldHint(field);
    if (hint) wrap.appendChild(hint);

    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "rounded-xl border border-dashed border-hairline bg-surface/60 px-4 py-6 text-center text-sm";
      empty.textContent = "Belum ada item. Tambahkan item pertama untuk mulai mengisi.";
      wrap.appendChild(empty);
      return wrap;
    }

    const listWrap = document.createElement("div");
    listWrap.className = "grid gap-3";

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "admin-item-card";

      const cardHeader = document.createElement("div");
      cardHeader.className = "mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3";

      const titleWrap = document.createElement("div");
      titleWrap.className = "flex min-w-0 items-center gap-2";
      const indexBadge = document.createElement("span");
      indexBadge.className = "grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary";
      indexBadge.textContent = String(index + 1).padStart(2, "0");
      const itemTitle = document.createElement("p");
      itemTitle.className = "truncate text-sm font-semibold text-ink";
      itemTitle.textContent = summaryValue(item, field.fields, index, field.itemLabel || "Item");
      titleWrap.append(indexBadge, itemTitle);

      const actions = document.createElement("div");
      actions.className = "flex items-center gap-1";

      const iconButton = (label, pathData, handler, disabled = false) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "admin-icon-btn";
        button.disabled = disabled;
        button.setAttribute("aria-label", label);
        button.innerHTML = `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pathData}</svg>`;
        button.addEventListener("click", handler);
        return button;
      };

      const move = (from, to) => {
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        renderSection(SECTIONS.find((section) => section.id === currentId));
        markDirty();
      };

      const up = iconButton("Naikkan", '<path d="M12 19V5M6 11l6-6 6 6" />', () => move(index, index - 1), index === 0);
      const down = iconButton("Turunkan", '<path d="M12 5v14M6 13l6 6 6-6" />', () => move(index, index + 1), index === items.length - 1);
      const remove = iconButton("Hapus", '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />', () => {
        if (!window.confirm(`Hapus “${summaryValue(item, field.fields, index, field.itemLabel || "Item")}”?`)) return;
        items.splice(index, 1);
        renderSection(SECTIONS.find((section) => section.id === currentId));
        markDirty();
      });
      remove.classList.add("hover:!border-red-300", "hover:!bg-red-50", "hover:!text-red-600");

      actions.append(up, down, remove);
      cardHeader.append(titleWrap, actions);
      card.appendChild(cardHeader);

      const grid = document.createElement("div");
      grid.className = "grid gap-3 sm:grid-cols-2";

      field.fields.forEach((itemField) => {
        const { element } = renderControl(itemField, item);
        if (itemField.type === "textarea" || itemField.type === "image") {
          element.classList.add("sm:col-span-2");
        }
        grid.appendChild(element);
      });

      // Live-update the item header summary as the user types.
      const summaryField = field.fields.find((itemField) =>
        ["title", "name", "label", "day", "value", "text"].includes(itemField.path)
      );
      if (summaryField) {
        grid.querySelectorAll("input, textarea").forEach((input) => {
          const descriptor = input.closest("div")?.querySelector("label")?.textContent;
          if (descriptor !== summaryField.label) return;
          input.addEventListener("input", () => {
            itemTitle.textContent = summaryValue(item, field.fields, index, field.itemLabel || "Item") || `${field.itemLabel || "Item"} ${index + 1}`;
          });
        });
      }

      card.appendChild(grid);
      listWrap.appendChild(card);
    });

    wrap.appendChild(listWrap);
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* Section rendering                                                  */
  /* ------------------------------------------------------------------ */

  function renderSection(section) {
    if (!content) return;
    uid = 0;
    fieldsWrap.innerHTML = "";

    const card = document.createElement("section");
    card.className = "admin-card overflow-hidden";

    const header = document.createElement("div");
    header.className = "border-b border-hairline bg-white px-5 py-4 sm:px-6";
    const title = document.createElement("h2");
    title.className = "font-display text-lg font-bold text-ink";
    title.textContent = section.title;
    const description = document.createElement("p");
    description.className = "mt-1 text-sm";
    description.textContent = section.description;
    header.append(title, description);

    const body = document.createElement("div");
    body.className = "grid gap-5 p-5 sm:p-6";

    section.fields.forEach((field) => {
      if (field.type === "group") {
        const groupTitle = document.createElement("p");
        groupTitle.className = "admin-group-label";
        groupTitle.textContent = field.label;
        body.appendChild(groupTitle);
        return;
      }
      if (field.type === "list") {
        body.appendChild(renderListField(field, section.id));
        return;
      }
      body.appendChild(renderControl(field, content).element);
    });

    card.append(header, body);
    fieldsWrap.appendChild(card);
    fieldsWrap.querySelectorAll("textarea").forEach(autoGrowTextarea);
    setStatus();
  }

  /* ------------------------------------------------------------------ */
  /* Save / discard / auth                                              */
  /* ------------------------------------------------------------------ */

  async function save() {
    if (!dirty || saving) return;
    saving = true;
    setStatus();
    try {
      await api(API.content, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      baseline = clone(content);
      dirty = false;
      saving = false;
      setStatus();
      applyBrandToAdmin(content.brand);
      toast("Konten tersimpan dan langsung tayang di landing page.");
    } catch (error) {
      saving = false;
      setStatus();
      if (error.status === 401) {
        showLogin("Sesi Anda berakhir. Silakan masuk kembali.");
        return;
      }
      toast(error.message || "Gagal menyimpan konten.", "error");
    }
  }

  function discardChanges() {
    if (!dirty) return;
    if (!window.confirm("Batalkan semua perubahan yang belum disimpan?")) return;
    content = clone(baseline);
    renderSection(SECTIONS.find((section) => section.id === currentId));
    dirty = false;
    setStatus();
    toast("Perubahan dibatalkan.", "info");
  }

  async function loadContent() {
    $("#loading-state").classList.remove("hidden");
    $("#load-error").classList.add("hidden");
    form.classList.add("hidden");
    try {
      const data = await api(API.content);
      if (!data.content || typeof data.content !== "object") {
        throw new Error("Format konten tidak dikenali.");
      }
      content = data.content;
      baseline = clone(content);
      dirty = false;
      $("#loading-state").classList.add("hidden");
      form.classList.remove("hidden");
      applyBrandToAdmin(content.brand);
      showSection(currentId, { keepScroll: true });
      setStatus();
    } catch (error) {
      $("#loading-state").classList.add("hidden");
      $("#load-error").classList.remove("hidden");
      $("#load-error-text").textContent = error.message || "Terjadi kesalahan saat memuat konten.";
      if (error.status === 401) showLogin("Sesi Anda berakhir. Silakan masuk kembali.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Branding                                                           */
  /* ------------------------------------------------------------------ */

  function applyBrandToAdmin(brand) {
    if (!brand || typeof brand !== "object") return;
    document.querySelectorAll("[data-admin-brand]").forEach((root) => {
      const image = root.querySelector("[data-brand-logo]");
      const mark = root.querySelector("[data-brand-mark]");
      const text = root.querySelector("[data-brand-text]");
      const name = root.querySelector("[data-brand-name]");
      const tagline = root.querySelector("[data-brand-tagline]");

      if (name && brand.name) name.textContent = brand.name;
      if (tagline && brand.tagline) tagline.textContent = brand.tagline;

      if (image) {
        if (brand.logo) {
          image.src = resolvePreviewSrc(brand.logo);
          image.alt = brand.logoAlt || brand.name || "Logo klinik";
          image.classList.remove("hidden");
          mark?.classList.add("hidden");
        } else {
          image.classList.add("hidden");
          image.removeAttribute("src");
          image.alt = "";
          mark?.classList.remove("hidden");
        }
      }

      if (text) text.classList.toggle("hidden", brand.showText === false);
    });
  }

  async function loadAdminBrand() {
    try {
      const response = await fetch("/api/content", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const data = await response.json();
      applyBrandToAdmin(data.brand);
    } catch {
      /* biarkan branding bawaan */
    }
  }

  function showLogin(message = "") {    appView.classList.add("hidden");
    loginView.classList.remove("hidden");
    loginView.classList.add("grid");
    const error = $("#login-error");
    if (message) {
      error.textContent = message;
      error.classList.remove("hidden");
    } else {
      error.classList.add("hidden");
      error.textContent = "";
    }
    $("#login-password").value = "";
    setTimeout(() => $("#login-password").focus(), 40);
  }

  function showApp() {
    loginView.classList.add("hidden");
    loginView.classList.remove("grid");
    appView.classList.remove("hidden");
  }

  async function handleLogin(event) {
    event.preventDefault();
    const password = $("#login-password").value;
    const error = $("#login-error");
    const submit = $("#login-submit");

    if (!password) {
      error.textContent = "Masukkan kata sandi terlebih dahulu.";
      error.classList.remove("hidden");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Memeriksa…";
    error.classList.add("hidden");

    try {
      await api(API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      showApp();
      await loadContent();
    } catch (loginError) {
      error.textContent = loginError.message || "Kata sandi salah.";
      error.classList.remove("hidden");
      $("#login-password").select();
    } finally {
      submit.disabled = false;
      submit.textContent = "Masuk";
    }
  }

  async function logout() {
    try {
      await api(API.logout, { method: "POST" });
    } catch {
      /* ignore network errors on logout */
    }
    content = null;
    baseline = null;
    dirty = false;
    showLogin();
  }

  function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.remove("hidden");
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.add("hidden");
  }

  function isMobile() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    $("#login-form").addEventListener("submit", handleLogin);
    $("#logout-btn").addEventListener("click", logout);
    saveBtn.addEventListener("click", save);
    discardBtn.addEventListener("click", discardChanges);
    form.querySelectorAll(".discard-inline").forEach((button) => button.addEventListener("click", discardChanges));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      save();
    });
    $("#retry-btn").addEventListener("click", loadContent);
    $("#sidebar-open").addEventListener("click", openSidebar);
    $("#sidebar-close").addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
    });

    window.addEventListener("beforeunload", (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });

    let growTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(growTimer);
      growTimer = setTimeout(() => {
        document.querySelectorAll("#editor-fields textarea").forEach(autoGrowTextarea);
      }, 150);
    });
  }

  async function init() {
    bindEvents();
    buildNav();
    loadAdminBrand();
    try {
      await api(API.session);
      showApp();
      await loadContent();
    } catch {
      showLogin();
    }
  }

  init();
})();
