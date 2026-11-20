/**
 * Klinik Aras Medical Center — landing page interactions.
 * No dependencies. Respects prefers-reduced-motion.
 */
(async () => {
  "use strict";

  // Wait for editable content to be applied before wiring the carousel and form,
  // so slides, service options, and labels reflect the latest published content.
  if (window.cmsReady) {
    try {
      await window.cmsReady;
    } catch {
      /* fall back to the copy baked into the HTML */
    }
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
   * 1. Sticky header state (CSS handles the surface via .is-scrolled)
   * ------------------------------------------------------------------ */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------
   * 2. Mobile menu
   * ------------------------------------------------------------------ */
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuOpenLabel = menuBtn.querySelector(".icon-open");
  const menuCloseLabel = menuBtn.querySelector(".icon-close");

  const setMenu = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("hidden", !open);
    menuOpenLabel.classList.toggle("hidden", open);
    menuCloseLabel.classList.toggle("hidden", !open);
    document.body.classList.toggle("overflow-hidden", open);
  };

  menuBtn.addEventListener("click", () => {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ------------------------------------------------------------------
   * 3. Scroll-reveal sections
   * ------------------------------------------------------------------ */
  const revealables = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    revealables.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
   * 4. Testimonial carousel — keyboard accessible, pausable
   * ------------------------------------------------------------------ */
  const carousel = document.getElementById("testimonial-carousel");
  if (carousel) {
    const track = carousel.querySelector("[data-track]");
    const slides = Array.from(track.children);
    if (slides.length === 0) carousel.hidden = true;
    const prevBtn = carousel.querySelector("[data-prev]");
    const nextBtn = carousel.querySelector("[data-next]");
    const pauseBtn = carousel.querySelector("[data-pause]");
    const dotsWrap = carousel.querySelector("[data-dots]");
    const liveRegion = carousel.querySelector("[aria-live]");
    const AUTOPLAY_MS = 7000;

    let index = 0;
    let timer = null;
    let paused = false;

    const dots = slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className =
        "h-2.5 rounded-full transition-all duration-300 cursor-pointer " +
        (i === 0 ? "w-8 bg-primary" : "w-2.5 bg-primary/25 hover:bg-primary/50");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Testimoni ${i + 1} dari ${slides.length}`);
      dot.setAttribute("aria-selected", String(i === 0));
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
      return dot;
    });

    function announce() {
      const name = slides[index].querySelector("[data-name]")?.textContent || "";
      liveRegion.textContent = `Testimoni ${index + 1} dari ${slides.length}: ${name}`;
    }

    function render() {
      if (slides.length === 0) return;
      const offset = slides[index].offsetLeft;
      track.style.transform = `translateX(-${offset}px)`;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
        const focusables = slide.querySelectorAll("a, button");
        focusables.forEach((f) => (f.tabIndex = i === index ? 0 : -1));
      });
      dots.forEach((dot, i) => {
        dot.setAttribute("aria-selected", String(i === index));
        dot.className =
          "h-2.5 rounded-full transition-all duration-300 cursor-pointer " +
          (i === index ? "w-8 bg-primary" : "w-2.5 bg-primary/25 hover:bg-primary/50");
      });
      announce();
    }

    function goTo(next, user) {
      index = (next + slides.length) % slides.length;
      render();
      if (user) stopAutoplay();
    }

    function startAutoplay() {
      if (prefersReducedMotion || paused || timer || slides.length === 0) return;
      timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    }

    function stopAutoplay() {
      clearInterval(timer);
      timer = null;
    }

    prevBtn.addEventListener("click", () => goTo(index - 1, true));
    nextBtn.addEventListener("click", () => goTo(index + 1, true));

    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.setAttribute("aria-pressed", String(paused));
      pauseBtn.querySelector("[data-play-label]").classList.toggle("hidden", !paused);
      pauseBtn.querySelector("[data-pause-label]").classList.toggle("hidden", paused);
      if (paused) stopAutoplay();
      else startAutoplay();
    });

    // Stop rotation on hover, focus, reduced motion (per UX guidance)
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", () => startAutoplay());
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1, true);
        prevBtn.focus();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1, true);
        nextBtn.focus();
      }
    });

    window.addEventListener("resize", () => render(), { passive: true });
    render();
    startAutoplay();
  }

  /* ------------------------------------------------------------------
   * 5. Appointment form — client-side validation, a11y errors
   * ------------------------------------------------------------------ */
  const form = document.getElementById("appointment-form");
  if (form) {
    const successBox = document.getElementById("form-success");
    const errorSummary = document.getElementById("error-summary");
    const errorList = errorSummary.querySelector("ul");
    const fields = Array.from(form.querySelectorAll("[data-validate]"));

    const validators = {
      name: (v) => (v.trim().length >= 3 ? "" : "Nama lengkap minimal 3 karakter."),
      phone: (v) =>
        /^(\+62|62|0)8[1-9][0-9]{6,12}$/.test(v.replace(/[\s-]/g, ""))
          ? ""
          : "Masukkan nomor WhatsApp Indonesia yang valid (contoh: 0812xxxxxxx).",
      service: (v) => (v ? "" : "Silakan pilih layanan."),
      date: (v) => {
        if (!v) return "Silakan pilih tanggal kunjungan.";
        const chosen = new Date(v);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return chosen >= today ? "" : "Tanggal kunjungan tidak boleh di masa lalu.";
      },
    };

    function validateField(field) {
      const rule = validators[field.name];
      if (!rule) return true;
      const message = rule(field.value);
      const errorEl = document.getElementById(`${field.id}-error`);
      field.setAttribute("aria-invalid", message ? "true" : "false");
      field.setAttribute("aria-describedby", message ? `${field.id}-error` : field.getAttribute("data-describedby") || "");
      errorEl.textContent = message;
      errorEl.classList.toggle("hidden", !message);
      return !message;
    }

    // Min date = today
    const dateInput = form.querySelector("#field-date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("change", () => validateField(field));
    });

    function whatsappNumber() {
      const source =
        window.cmsContent?.contact?.phoneHref ||
        document.querySelector('a[href^="tel:"]')?.getAttribute("href") ||
        "";
      let digits = String(source).replace(/[^\d]/g, "");
      if (!digits) return "";
      if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
      else if (digits.startsWith("8")) digits = `62${digits}`;
      return digits;
    }

    function formatVisitDate(value) {
      if (!value) return "";
      const [year, month, day] = value.split("-").map(Number);
      if (!year || !month || !day) return value;
      return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    function buildWhatsappUrl() {
      const number = whatsappNumber();
      if (!number) return "";
      const clinic = window.cmsContent?.brand?.name || "klinik";
      const name = form.querySelector("#field-name").value.trim();
      const phone = form.querySelector("#field-phone").value.trim();
      const date = formatVisitDate(form.querySelector("#field-date").value);
      const serviceSelect = form.querySelector("#field-service");
      const service = serviceSelect.options[serviceSelect.selectedIndex]?.text || serviceSelect.value;
      const message = [
        `Halo ${clinic}, saya ingin membuat janji temu.`,
        "",
        `Nama: ${name}`,
        `Nomor WhatsApp: ${phone}`,
        `Tanggal kunjungan: ${date}`,
        `Layanan: ${service}`,
      ].join("\n");
      return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const invalid = fields.filter((field) => !validateField(field));

      if (invalid.length > 0) {
        errorList.innerHTML = "";
        invalid.forEach((field) => {
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.href = `#${field.id}`;
          link.className = "font-semibold underline decoration-2 underline-offset-2";
          link.textContent = field.getAttribute("data-label");
          link.addEventListener("click", (e) => {
            e.preventDefault();
            field.focus();
          });
          const label = field.getAttribute("data-label");
          li.appendChild(link);
          li.appendChild(document.createTextNode(` — ${document.getElementById(`${field.id}-error`).textContent}`));
          li.setAttribute("data-label-text", label);
          errorList.appendChild(li);
        });
        errorSummary.classList.remove("hidden");
        errorSummary.focus();
        return;
      }

      errorSummary.classList.add("hidden");

      // Kirim detail janji temu langsung ke WhatsApp klinik.
      const waUrl = buildWhatsappUrl();
      if (waUrl) {
        const waLink = document.getElementById("form-success-wa");
        if (waLink) waLink.href = waUrl;
        window.open(waUrl, "_blank", "noopener");
      }

      form.classList.add("hidden");
      successBox.removeAttribute("hidden");
      successBox.focus();
    });
  }

  /* ------------------------------------------------------------------
   * 6. Footer year
   * ------------------------------------------------------------------ */
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
