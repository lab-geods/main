/* The same portable JSON drives the main page, publications and the atlas. */
(() => {
  "use strict";
  const root = new URL("../", document.currentScript.src);
  window.GEOSiteRoot = root.href;
  window.GEODataReady = (async () => {
    const preview =
      new URLSearchParams(location.search).get("preview") === "1" &&
      !/\/admin(?:\/|$)/.test(location.pathname);
    if (preview) {
      try {
        const draft = JSON.parse(localStorage.getItem("geods-content-draft") || "null");
        if (draft?.content) {
          window.GEODataPreviewImages = draft.previews || {};
          window.GEODataIsPreview = true;
          return window.GEOContent.validate(draft.content);
        }
      } catch (error) {
        console.warn("GEO-DS: draft preview unavailable.", error.message);
      }
    }
    try {
      const response = await fetch(new URL("content/geods.json", root), {
        cache: "no-cache",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error("Conteúdos indisponíveis");
      return window.GEOContent.validate(await response.json());
    } catch (error) {
      console.warn("GEO-DS: using the bundled content snapshot.", error.message);
      window.GEODataUsedFallback = true;
      return window.GEOContent.validate(window.GEOContentFallback);
    }
  })();
  window.GEODataReady.then(() => {
    if (!window.GEODataIsPreview) return;
    const banner = document.createElement("div");
    banner.className = "draft-preview-banner";
    banner.setAttribute("role", "status");
    banner.textContent = document.documentElement.lang.startsWith("en")
      ? "Draft preview — visible only in this browser."
      : "Pré-visualização de rascunho — visível apenas neste browser.";
    document.body.prepend(banner);
    for (const link of document.querySelectorAll("a[href]")) {
      const raw = link.getAttribute("href");
      if (raw.startsWith("#")) continue;
      try {
        const url = new URL(raw, location.href);
        if (url.origin === location.origin && !/\/admin(?:\/|$)/.test(url.pathname)) {
          url.searchParams.set("preview", "1");
          link.href = url.href;
        }
      } catch {}
    }
  });
})();
