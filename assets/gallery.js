/* The public gallery uses the same validated records edited by the backoffice. */
(async () => {
  "use strict";
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid) return;
  const en = document.documentElement.lang.startsWith("en"),
    lang = en ? "en" : "pt";
  const C = window.GEOContent,
    root = window.GEOSiteRoot;
  const labels = en
    ? {
        all: "All images",
        fieldwork: "Fieldwork",
        laboratory: "Laboratory",
        models: "Digital models",
        events: "Events",
        empty: "There are no images in this category yet.",
        unavailable: "Image unavailable",
        count: "images",
        credit: "Credit",
        previous: "Previous image",
        next: "Next image",
      }
    : {
        all: "Todas as imagens",
        fieldwork: "Trabalho de campo",
        laboratory: "Laboratório",
        models: "Modelos digitais",
        events: "Eventos",
        empty: "Ainda não há imagens nesta categoria.",
        unavailable: "Imagem indisponível",
        count: "imagens",
        credit: "Créditos",
        previous: "Imagem anterior",
        next: "Imagem seguinte",
      };
  const filters = document.querySelector("[data-gallery-filters]"),
    count = document.querySelector("[data-gallery-count]"),
    dialog = document.querySelector(".gallery-dialog"),
    strip = document.querySelector("[data-gallery-strip]"),
    imageError = document.querySelector("[data-gallery-image-error]");
  let visible = [],
    index = 0,
    opener = null;
  try {
    const data = await window.GEODataReady;
    const photos = data.gallery
      .filter((item) => item.status === "published")
      .sort((a, b) => a.order - b.order);
    const categories = [
      "all",
      ...C.GALLERY_TYPES.filter((type) => photos.some((photo) => photo.category === type)),
    ];
    filters.innerHTML = categories
      .map(
        (type) =>
          `<button type="button" data-gallery-filter="${type}" aria-pressed="${type === "all"}">${labels[type]}</button>`,
      )
      .join("");
    function render(type = "all") {
      visible = photos.filter((photo) => type === "all" || photo.category === type);
      filters
        .querySelectorAll("button")
        .forEach((button) =>
          button.setAttribute("aria-pressed", String(button.dataset.galleryFilter === type)),
        );
      count.textContent = `${visible.length} ${visible.length === 1 ? (en ? "image" : "imagem") : labels.count}`;
      grid.innerHTML = visible.length
        ? visible
            .map(
              (photo, i) =>
                `<button type="button" class="gallery-card" style="--gallery-order:${Math.min(i, 10)}" data-photo="${C.esc(photo.id)}" aria-label="${en ? "Enlarge" : "Ampliar"}: ${C.esc(C.text(photo.title, lang))}"><div class="gallery-thumb"><img src="${C.esc(C.imageURL({ image: photo.thumbnail || photo.image }, root))}" alt="${C.esc(C.text(photo.alt, lang))}" loading="lazy" decoding="async"${photo.width && photo.height ? ` width="${photo.width}" height="${photo.height}"` : ""}><span class="gallery-open" aria-hidden="true">↗</span></div><span class="gallery-card-meta"><span class="gallery-number" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span><span class="eyebrow">${labels[photo.category]}</span><h3>${C.esc(C.text(photo.title, lang))}</h3></span></span></button>`,
            )
            .join("")
        : `<p class="gallery-empty">${labels.empty}</p>`;
      for (const img of grid.querySelectorAll("img"))
        img.addEventListener(
          "error",
          () => {
            const message = document.createElement("span");
            message.className = "gallery-unavailable";
            message.textContent = labels.unavailable;
            img.replaceWith(message);
          },
          { once: true },
        );
    }
    function renderStrip() {
      strip.innerHTML = visible
        .map(
          (photo, i) =>
            `<button type="button" class="gallery-strip-thumb" data-gallery-pick="${i}" aria-current="false" aria-label="${en ? "View photo" : "Ver fotografia"} ${i + 1}: ${C.esc(C.text(photo.title, lang))}"><img src="${C.esc(C.imageURL({ image: photo.thumbnail || photo.image }, root))}" alt="" loading="lazy" decoding="async" width="72" height="48"></button>`,
        )
        .join("");
    }
    function revealSelection() {
      strip
        .querySelector('[aria-current="true"]')
        ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    }
    function show(next) {
      if (!visible.length) return;
      index = (next + visible.length) % visible.length;
      const photo = visible[index],
        img = dialog.querySelector("[data-gallery-image]");
      img.hidden = false;
      imageError.hidden = true;
      img.src = C.imageURL(photo, root);
      img.alt = C.text(photo.alt, lang);
      dialog.querySelector("#gallery-lightbox-title").textContent = C.text(photo.title, lang);
      dialog.querySelector("[data-gallery-caption]").textContent = C.text(photo.caption, lang);
      dialog.querySelector("[data-gallery-position]").textContent =
        `${index + 1} / ${visible.length} · ${labels[photo.category]}`;
      dialog.querySelector("[data-gallery-credit]").textContent = [
        photo.credit ? `${labels.credit}: ${photo.credit}` : "",
        photo.date
          ? new Intl.DateTimeFormat(en ? "en-GB" : "pt-PT", {
              dateStyle: "long",
              timeZone: "UTC",
            }).format(new Date(photo.date + "T12:00:00Z"))
          : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const source = dialog.querySelector("[data-gallery-source]");
      source.hidden = !photo.sourceURL;
      if (photo.sourceURL) source.href = photo.sourceURL;
      for (const button of dialog.querySelectorAll("[data-gallery-prev], [data-gallery-next]"))
        button.hidden = visible.length < 2;
      strip
        .querySelectorAll("[data-gallery-pick]")
        .forEach((button, i) => button.setAttribute("aria-current", String(i === index)));
      strip.hidden = visible.length < 2;
      if (dialog.open) revealSelection();
    }
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gallery-filter]");
      if (button) render(button.dataset.galleryFilter);
    });
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-photo]");
      if (!button) return;
      opener = button;
      renderStrip();
      show(visible.findIndex((photo) => photo.id === button.dataset.photo));
      dialog.showModal();
      revealSelection();
      dialog.querySelector("[data-gallery-close]").focus();
    });
    strip.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gallery-pick]");
      if (button) show(Number(button.dataset.galleryPick));
    });
    dialog.querySelector("[data-gallery-image]").addEventListener("error", (event) => {
      event.target.hidden = true;
      imageError.textContent = labels.unavailable;
      imageError.hidden = false;
    });
    dialog.querySelector("[data-gallery-close]").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-gallery-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-gallery-next]").addEventListener("click", () => show(index + 1));
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        show(index + (event.key === "ArrowRight" ? 1 : -1));
        if (event.target.closest("[data-gallery-pick]"))
          strip.querySelector('[aria-current="true"]')?.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => opener?.isConnected && opener.focus());
    render();
  } catch (error) {
    count.textContent = en
      ? "The gallery could not be loaded. Reload the page to try again."
      : "Não foi possível carregar a galeria. Recarrega a página para tentar novamente.";
    console.warn("GEO-DS gallery:", error.message);
  }
})();
