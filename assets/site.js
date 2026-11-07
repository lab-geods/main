/* Preserve bookmarked section links after the move to dedicated pages. */
(() => {
  "use strict";
  if (document.body.dataset.page !== "home") return;
  const en = document.documentElement.lang.startsWith("en");
  const pages = {
    laboratorio: ["laboratorio.html", "en/laboratory.html"],
    investigacao: ["investigacao.html", "en/research.html"],
    tecnologias: ["tecnologias.html", "en/technologies.html"],
    trabalhos: ["projetos.html", "en/projects.html"],
    publicacoes: ["publicacoes.html", "en/publications.html"],
    pessoas: ["pessoas.html", "en/people.html"],
    contacto: ["contactos.html", "en/contact.html"],
  };
  const target = pages[location.hash.slice(1)];
  if (!target) return;
  const url = new URL(target[en ? 1 : 0], window.GEOSiteRoot);
  if (new URLSearchParams(location.search).get("preview") === "1")
    url.searchParams.set("preview", "1");
  location.replace(url.href);
})();
