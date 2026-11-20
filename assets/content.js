/**
 * Klinik Aras — content renderer.
 *
 * The landing page ships with its copy baked into index.html so it still works
 * when opened directly from disk. When served by `server.mjs`, this script
 * fetches the editable content and reconciles the DOM with it.
 *
 * Hook attributes:
 *   data-cms="path.to.text"              → sets textContent
 *   data-cms-href="path.to.href"         → sets href
 *   data-cms-image="path.to.src"         → sets src
 *   data-cms-alt="path.to.alt"           → sets alt
 *   data-cms-icon="path.to.icon"         → swaps a whitelisted SVG icon
 *   data-cms-options="path.to.options"   → rebuilds a <select>
 *   data-cms-list="path.to.items"        → repeatable list container
 *     └ [data-cms-item]                  → item prototype
 *        ├ data-field="text"             → textContent
 *        ├ data-field-src / -alt (img)   → src / alt
 *        ├ data-field-href (a)           → href
 *        ├ data-field-icon               → icon
 *        └ data-step-number              → auto 01, 02, …
 */
(() => {
  "use strict";

  const ICONS = {
    heart:
      '<path d="M12 21s-7.5-4.6-9.5-9.1C1 8 3 5 6.5 5c2 0 3.6 1.2 4.5 2.5.9-1.3 2.5-2.5 4.5-2.5C19 5 21 8 20.5 11.9 19.5 16.4 12 21 12 21z" />',
    child:
      '<circle cx="9" cy="7" r="3" /><path d="M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" /><path d="M16 3.5c1.2.5 2 1.7 2 3M19.5 2c1.8 1 3 2.9 3 5" />',
    female:
      '<circle cx="12" cy="6" r="3" /><circle cx="5.5" cy="15.5" r="2.5" /><circle cx="18.5" cy="15.5" r="2.5" /><path d="M12 9v3m0 0-4.3 2.4M15 12l3.1 2M12 12l4.3 2.4M12 12l-4.3 2.4" />',
    "heart-pulse":
      '<path d="M12 21s-7.5-4.6-9.5-9.1C1 8 3 5 6.5 5c2 0 3.6 1.2 4.5 2.5.9-1.3 2.5-2.5 4.5-2.5C19 5 21 8 20.5 11.9 19.5 16.4 12 21 12 21z" /><path d="M4.5 12h4l1.5-3 2.5 6 1.5-3h5.5" />',
    lab:
      '<path d="M9 2v6l-5.3 8.6A3 3 0 0 0 6.3 21h11.4a3 3 0 0 0 2.6-4.4L15 8V2" /><path d="M7 2h10M8 15h8" />',
    checkup:
      '<path d="M20 12a8 8 0 1 0-16 0v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6z" /><path d="M8 12h8M12 8v8" />',
    stethoscope:
      '<path d="M4 3v6a5 5 0 0 0 10 0V3" /><path d="M4 3h3M11 3h3" /><path d="M9 14v2a5 5 0 0 0 10 0v-2" /><circle cx="19" cy="11" r="2" />',
    tooth:
      '<path d="M12 5.5C10.5 4 8.5 3 7 3 4.8 3 3 5 3 7.5c0 1.6.5 2.8.9 4.3.4 1.6.4 3.2.7 4.7.2 1 .6 2 1.4 2 1 0 1.3-1.2 1.5-2.4.2-1.5.4-3 2.5-3s2.3 1.5 2.5 3c.2 1.2.5 2.4 1.5 2.4.8 0 1.2-1 1.4-2 .3-1.5.3-3.1.7-4.7.4-1.5.9-2.7.9-4.3C21 5 19.2 3 17 3c-1.5 0-3.5 1-5 2.5z" />',
    eye:
      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />',
    bone:
      '<path d="M6.5 6.5a3 3 0 0 0-4 4c.4.4.9.6 1.4.7l.6 1.4c-.2.5-.1 1 .2 1.5a3 3 0 1 0 4-4c-.4-.4-.9-.6-1.4-.7l-.6-1.4c.2-.5.1-1-.2-1.5z" /><path d="M17.5 17.5a3 3 0 0 0 4-4c-.4-.4-.9-.6-1.4-.7l-.6-1.4c.2-.5.1-1-.2-1.5a3 3 0 1 0-4 4c.4.4.9.6 1.4.7l.6 1.4c-.2.5-.1 1 .2 1.5z" /><path d="M9 15 15 9" />',
    activity:
      '<path d="M3 12h4l3-8 4 16 3-8h4" />',
    shield:
      '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" /><path d="M9 12l2 2 4-4" />'
  };

  const get = (obj, path) => {
    if (!obj) return undefined;
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  };

  const setText = (el, value) => {
    if (value === undefined || value === null) return;
    el.textContent = String(value);
  };

  const setIcon = (el, name) => {
    const svg = ICONS[name];
    if (!svg) return;
    const existing = el.querySelector("svg");
    if (existing) {
      existing.innerHTML = svg;
      return;
    }
    el.innerHTML = `<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;
  };

  function renderSimple(data, root = document) {
    root.querySelectorAll("[data-cms]").forEach((el) => {
      setText(el, get(data, el.dataset.cms));
    });
    root.querySelectorAll("[data-cms-href]").forEach((el) => {
      const href = get(data, el.dataset.cmsHref);
      if (href) el.setAttribute("href", href);
    });
    root.querySelectorAll("[data-cms-image]").forEach((el) => {
      const src = get(data, el.dataset.cmsImage);
      if (src) el.setAttribute("src", src);
    });
    root.querySelectorAll("[data-cms-alt]").forEach((el) => {
      const alt = get(data, el.dataset.cmsAlt);
      if (alt !== undefined) el.setAttribute("alt", alt);
    });
    root.querySelectorAll("[data-cms-mailto]").forEach((el) => {
      const email = get(data, el.dataset.cmsMailto);
      if (email) el.setAttribute("href", `mailto:${email}`);
    });
    root.querySelectorAll("[data-cms-icon]").forEach((el) => {
      setIcon(el, get(data, el.dataset.cmsIcon));
    });
    root.querySelectorAll("[data-cms-options]").forEach((select) => {
      const options = get(data, select.dataset.cmsOptions);
      if (!Array.isArray(options)) return;
      select.querySelectorAll("option:not([value=''])").forEach((optionEl) => optionEl.remove());
      options.forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value ?? "";
        optionEl.textContent = option.label ?? "";
        optionEl.className = "text-ink";
        select.appendChild(optionEl);
      });
    });
  }

  function fillItem(node, item, index) {
    const model = item && typeof item === "object" ? item : {};

    node.querySelectorAll("[data-field]").forEach((fieldEl) => {
      const value = model[fieldEl.dataset.field];
      if (value === undefined || value === null) return;
      if (fieldEl.tagName === "IMG") fieldEl.setAttribute("src", value);
      else fieldEl.textContent = String(value);
    });

    node.querySelectorAll("[data-field-src]").forEach((fieldEl) => {
      const value = model[fieldEl.dataset.fieldSrc];
      if (value) fieldEl.setAttribute("src", value);
    });

    node.querySelectorAll("[data-field-alt]").forEach((fieldEl) => {
      const value = model[fieldEl.dataset.fieldAlt];
      if (value !== undefined) fieldEl.setAttribute("alt", value);
    });

    node.querySelectorAll("[data-field-href]").forEach((fieldEl) => {
      const value = model[fieldEl.dataset.fieldHref];
      if (value) fieldEl.setAttribute("href", value);
    });

    node.querySelectorAll("[data-field-icon]").forEach((fieldEl) => {
      setIcon(fieldEl, model[fieldEl.dataset.fieldIcon]);
    });

    node.querySelectorAll("[data-step-number]").forEach((stepEl) => {
      stepEl.textContent = String(index + 1).padStart(2, "0");
    });

    if (node.dataset.itemLabel) {
      const total = node.parentElement.querySelectorAll(":scope > [data-cms-item]").length;
      node.setAttribute("aria-label", `${node.dataset.itemLabel} ${index + 1} dari ${total || index + 1}`);
    }
  }

  function renderList(container, items) {
    if (!Array.isArray(items)) return;
    const prototype = container.querySelector(":scope > [data-cms-item]");
    if (!prototype) return;

    const nodes = Array.from(container.querySelectorAll(":scope > [data-cms-item]"));

    while (nodes.length > items.length) {
      nodes.pop().remove();
    }
    while (nodes.length < items.length) {
      const clone = prototype.cloneNode(true);
      container.appendChild(clone);
      nodes.push(clone);
    }

    items.forEach((item, index) => fillItem(nodes[index], item, index));
  }

  function renderLists(data, root = document) {
    root.querySelectorAll("[data-cms-list]").forEach((container) => {
      renderList(container, get(data, container.dataset.cmsList));
    });
  }

  function renderLogos(data) {
    document.querySelectorAll("[data-cms-logo]").forEach((root) => {
      const brand = get(data, root.dataset.cmsLogo);
      if (!brand || typeof brand !== "object") return;

      const image = root.querySelector("[data-brand-logo]");
      const mark = root.querySelector("[data-brand-mark]");
      const text = root.querySelector("[data-brand-text]");
      const label = [brand.name, brand.tagline].filter(Boolean).join(" ") || "Beranda";

      if (image) {
        if (brand.logo) {
          image.src = brand.logo;
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
      root.setAttribute("aria-label", `${label} — beranda`);
    });
  }

  function renderMeta(data) {
    const meta = data.meta || {};
    if (meta.title) document.title = meta.title;

    const setMeta = (selector, attr, value) => {
      if (!value) return;
      const node = document.head.querySelector(selector);
      if (node) node.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[property="og:title"]', "content", meta.ogTitle || meta.title);
    setMeta('meta[property="og:description"]', "content", meta.ogDescription || meta.description);

    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld && data.contact) {
      try {
        const schema = JSON.parse(ld.textContent);
        schema.name = data.brand?.name ? `${data.brand.name} ${data.brand.tagline || ""}`.trim() : schema.name;
        schema.telephone = data.contact.phoneHref || schema.telephone;
        if (schema.address) {
          const parts = String(data.contact.address || "").split(",");
          schema.address.streetAddress = parts.shift()?.trim() || schema.address.streetAddress;
          schema.address.addressLocality = parts.join(",").trim() || schema.address.addressLocality;
        }
        ld.textContent = JSON.stringify(schema);
      } catch {
        /* keep the original structured data if it can't be parsed */
      }
    }
  }

  function apply(data) {
    if (!data || typeof data !== "object") return;
    window.cmsContent = data;
    renderMeta(data);
    renderSimple(data);
    renderLogos(data);
    renderLists(data);
    document.documentElement.classList.add("cms-ready");
  }

  async function load() {
    const sources = ["/api/content", "content/site.json"];
    for (const source of sources) {
      try {
        const response = await fetch(source, { headers: { Accept: "application/json" } });
        if (!response.ok) continue;
        const data = await response.json();
        apply(data);
        return data;
      } catch {
        /* try the next source, then leave the baked-in copy untouched */
      }
    }
    return null;
  }

  window.cmsReady = load();
})();
