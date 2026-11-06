/* Public articles and news, rendered from the shared content collection. */
(async () => {
  "use strict";
  const data = await window.GEODataReady,
    C = window.GEOContent,
    root = window.GEOSiteRoot,
    en = document.documentElement.lang.startsWith("en"),
    lang = en ? "en" : "pt";
  const labels = en
    ? {
        all: "All",
        article: "Scientific article",
        news: "News",
        read: "Read more",
        source: "Read the original",
        back: "Back to publications",
        none: "No publications match this filter.",
        missing: "Publication not found.",
      }
    : {
        all: "Todas",
        article: "Artigo científico",
        news: "Notícia",
        read: "Ler mais",
        source: "Consultar publicação original",
        back: "Voltar às publicações",
        none: "Não há publicações com este filtro.",
        missing: "Publicação não encontrada.",
      };
  const list = data.publications
    .filter((p) => p.status !== "hidden")
    .sort((a, b) => b.date.localeCompare(a.date));
  const detailURL = (id) => {
    const u = new URL(en ? "en/publication.html" : "publicacao.html", root);
    u.searchParams.set("id", id);
    if (window.GEODataIsPreview) u.searchParams.set("preview", "1");
    return u.href;
  };
  const date = (p) =>
    new Intl.DateTimeFormat(en ? "en-GB" : "pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(p.date + "T12:00:00Z"));
  const grid = document.querySelector("[data-publication-list]");
  function row(p) {
    return `<article class="publication"><span class="publication-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></svg></span><div class="publication-copy"><p class="eyebrow">${labels[p.kind]} · <time datetime="${C.esc(p.date)}">${C.esc(date(p))}</time></p><h3><a href="${C.esc(detailURL(p.id))}">${C.esc(C.text(p.title, lang))}</a></h3><p>${C.esc(p.journal || C.text(p.summary, lang))}</p></div><a class="text-link" href="${C.esc(detailURL(p.id))}">${labels.read}<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6h12v12"/></svg></a></article>`;
  }
  if (grid) {
    const buttons = [...document.querySelectorAll("[data-publication-filter]")];
    function render(kind = "all") {
      const visible = list.filter((p) => kind === "all" || p.kind === kind);
      grid.innerHTML = visible.length
        ? visible.map(row).join("")
        : `<p class="publication-empty" role="status">${labels.none}</p>`;
      buttons.forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.publicationFilter === kind)),
      );
    }
    buttons.forEach((b) => b.addEventListener("click", () => render(b.dataset.publicationFilter)));
    render();
  }
  const mount = document.querySelector("[data-publication-detail]");
  if (mount) {
    const id = new URLSearchParams(location.search).get("id"),
      p = list.find((p) => p.id === id),
      back = new URL(en ? "en/index.html" : "index.html", root);
    back.hash = "publicacoes";
    if (window.GEODataIsPreview) back.searchParams.set("preview", "1");
    for (const link of document.querySelectorAll(".language-switch a")) {
      const target = link.textContent.trim() === "EN" ? "en/publication.html" : "publicacao.html",
        url = new URL(target, root);
      if (id) url.searchParams.set("id", id);
      if (window.GEODataIsPreview) url.searchParams.set("preview", "1");
      link.href = url.href;
    }
    if (!p) {
      mount.innerHTML = `<h1>${labels.missing}</h1><a class="text-link" href="${C.esc(back.href)}">${labels.back}</a>`;
      return;
    }
    document.title = C.text(p.title, lang) + " | GEO-DS";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = C.text(p.summary, lang);
    const paragraphs = C.text(p.body, lang)
      .split(/\n\s*\n/)
      .map((t) => `<p>${C.esc(t).replace(/\n/g, "<br>")}</p>`)
      .join("");
    mount.innerHTML = `<a class="text-link publication-back" href="${C.esc(back.href)}">← ${labels.back}</a><div class="publication-meta"><span>${labels[p.kind]}</span><time datetime="${C.esc(p.date)}">${C.esc(date(p))}</time></div><h1>${C.esc(C.text(p.title, lang))}</h1><p class="publication-lead">${C.esc(C.text(p.summary, lang))}</p>${p.authors ? `<p class="publication-byline">${C.esc(p.authors)}</p>` : ""}${p.image ? `<img class="publication-detail-image" src="${C.esc(C.imageURL(p, root))}" alt="" width="1200" height="750">` : ""}<div class="publication-body">${paragraphs}</div>${p.journal ? `<p class="publication-citation">${C.esc(p.journal)}${p.doi ? " · DOI: " + C.esc(p.doi) : ""}</p>` : ""}${p.url ? `<a class="button primary" href="${C.esc(p.url)}" target="_blank" rel="noopener noreferrer">${labels.source} ↗</a>` : ""}`;
  }
})();
