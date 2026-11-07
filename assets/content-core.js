/* Shared public-content schema and safe rendering helpers. No credentials live here. */
((global) => {
  "use strict";
  const TYPES = ["aereo", "terrestre", "multi", "hyper"];
  const GALLERY_TYPES = ["fieldwork", "laboratory", "models", "events"];
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const normalise = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-PT");
  const clean = (value, max = 500) =>
    String(value ?? "")
      .trim()
      .slice(0, max);
  const translated = (value, max = 500) => {
    const pt = clean(typeof value === "string" ? value : value?.pt, max);
    return { pt, en: clean(value?.en, max) || pt };
  };
  const text = (value, lang = "pt") =>
    typeof value === "string" ? value : value?.[lang] || value?.pt || "";
  const fail = (message) => {
    throw new Error(message);
  };
  function uid() {
    if (typeof global.crypto?.randomUUID === "function") return global.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (global.crypto?.getRandomValues) global.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  function safePath(value) {
    const s = clean(value, 2048);
    if (!s || s.startsWith("//") || /[\u0000-\u001f\\]/.test(s)) return "";
    if (/^https:\/\//i.test(s)) {
      try {
        const u = new URL(s);
        return u.username || u.password ? "" : u.href;
      } catch {
        return "";
      }
    }
    if (
      /^[a-z][a-z\d+.-]*:/i.test(s) ||
      s.startsWith("/") ||
      s.split("/").some((p) => p === ".." || p === ".") ||
      /[?#]/.test(s)
    )
      return "";
    return s;
  }
  function externalURL(value) {
    const s = clean(value, 2048);
    if (!s) return "";
    try {
      const u = new URL(s);
      return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
    } catch {
      return "";
    }
  }
  function embedID(value) {
    const raw = clean(value, 2048);
    if (/^[\w-]{2,100}$/.test(raw)) return raw;
    try {
      const u = new URL(raw);
      if (u.protocol === "https:" && ["realitymax.co", "www.realitymax.co"].includes(u.hostname)) {
        const match = u.pathname.match(/^\/embed\/([\w-]+)\/?$/);
        if (match) return match[1];
      }
    } catch {}
    return "";
  }
  function coordinate(value, min, max) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
  }
  function validate(input) {
    if (!input || typeof input !== "object" || Array.isArray(input) || input.schemaVersion !== 1)
      fail("O ficheiro não tem um formato de conteúdos GEO-DS compatível.");
    if (!Array.isArray(input.models) || !Array.isArray(input.publications))
      fail("Faltam as listas de modelos ou publicações.");
    if (input.models.length > 10000 || input.publications.length > 10000)
      fail("O ficheiro excede o limite de conteúdos.");
    const modelIDs = new Set(),
      publicationIDs = new Set();
    const models = input.models.map((item, index) => {
      const id = clean(item?.id, 100),
        url = embedID(item?.url),
        title = translated(item?.title, 240);
      if (!/^[\w-]{2,100}$/.test(id) || modelIDs.has(id))
        fail(`Identificador inválido ou repetido no modelo ${index + 1}.`);
      if (!title.pt || !TYPES.includes(item.t) || !url)
        fail(`Preenche o título, a tecnologia e o endereço RealityMax do modelo ${index + 1}.`);
      const lat = coordinate(item.lat, -90, 90),
        lng = coordinate(item.lng, -180, 180);
      if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === null) !== (lng === null))
        fail(`As coordenadas do modelo ${index + 1} não são válidas.`);
      const image = item.image ? safePath(item.image) : "";
      if (item.image && !image)
        fail(`A imagem do modelo ${index + 1} deve ser um caminho relativo ou um endereço HTTPS.`);
      let pointCloud;
      if (item.pointCloud) {
        pointCloud = {
          pt: safePath(item.pointCloud.pt),
          en: safePath(item.pointCloud.en || item.pointCloud.pt),
        };
        if (!Object.values(pointCloud).every((path) => /^[\w/-]+\.html$/.test(path)))
          fail(`A nuvem de pontos do modelo ${index + 1} deve usar páginas locais.`);
      }
      modelIDs.add(id);
      return {
        id,
        t: item.t,
        lat,
        lng,
        approx: Boolean(item.approx),
        img: clean(item.img, 300),
        ...(image ? { image } : {}),
        ...(pointCloud ? { pointCloud } : {}),
        url,
        title,
        sensor: clean(item.sensor),
        area: clean(item.area),
        locality: clean(item.locality ?? item.local, 180),
        municipality: clean(item.municipality, 180),
        district: clean(item.district, 180),
        locationDetail: clean(item.locationDetail, 180),
        country: clean(item.country, 100),
        locationSource: clean(item.locationSource, 150),
        locationConfirmed: Boolean(item.locationConfirmed),
        status: item.status === "hidden" ? "hidden" : "published",
      };
    });
    const publications = input.publications.map((item, index) => {
      const id = clean(item?.id, 100),
        title = translated(item?.title, 240),
        summary = translated(item?.summary, 1800),
        body = translated(item?.body, 60000);
      if (!/^[\w-]{2,100}$/.test(id) || publicationIDs.has(id))
        fail(`Identificador inválido ou repetido na publicação ${index + 1}.`);
      if (!title.pt || !["article", "news"].includes(item.kind))
        fail(`Preenche o título e o tipo da publicação ${index + 1}.`);
      const date = clean(item.date, 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        fail(`A data da publicação ${index + 1} não é válida.`);
      const url = item.url ? externalURL(item.url) : "",
        image = item.image ? safePath(item.image) : "";
      if (item.url && !url)
        fail(`O endereço da publicação ${index + 1} tem de começar por https://.`);
      if (item.image && !image) fail(`A imagem da publicação ${index + 1} não é válida.`);
      publicationIDs.add(id);
      return {
        id,
        kind: item.kind,
        status: item.status === "hidden" ? "hidden" : "published",
        date,
        title,
        summary,
        body,
        url,
        doi: clean(item.doi, 250),
        authors: clean(item.authors, 2000),
        journal: clean(item.journal, 350),
        image,
      };
    });
    const photos = input.gallery ?? [];
    if (!Array.isArray(photos) || photos.length > 10000)
      fail("A lista de fotografias não é válida ou excede o limite de conteúdos.");
    const photoIDs = new Set();
    const gallery = photos.map((item, index) => {
      const id = clean(item?.id, 100),
        title = translated(item?.title, 240),
        image = safePath(item?.image),
        thumbnail = item?.thumbnail ? safePath(item.thumbnail) : "",
        width = Number(item?.width || 0),
        height = Number(item?.height || 0),
        order = Number(item?.order ?? index + 1),
        date = clean(item?.date, 10),
        sourceURL = item?.sourceURL ? externalURL(item.sourceURL) : "";
      if (!/^[\w-]{2,100}$/.test(id) || photoIDs.has(id))
        fail(`Identificador inválido ou repetido na fotografia ${index + 1}.`);
      if (!title.pt || !image || !GALLERY_TYPES.includes(item.category))
        fail(`Preenche o título, a imagem e a categoria da fotografia ${index + 1}.`);
      if (item.thumbnail && !thumbnail)
        fail(`A miniatura da fotografia ${index + 1} deve usar um caminho seguro.`);
      if (
        ![width, height].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 65535) ||
        Boolean(width) !== Boolean(height)
      )
        fail(`As dimensões da fotografia ${index + 1} não são válidas.`);
      if (!Number.isSafeInteger(order) || order < 0 || order > 100000)
        fail(`A ordem da fotografia ${index + 1} não é válida.`);
      if (
        date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(date)) ||
          new Date(date).toISOString().slice(0, 10) !== date)
      )
        fail(`A data da fotografia ${index + 1} não é válida.`);
      if (item.sourceURL && !sourceURL)
        fail(`A fonte da fotografia ${index + 1} deve usar um endereço HTTPS.`);
      photoIDs.add(id);
      return {
        id,
        title,
        image,
        thumbnail,
        width,
        height,
        caption: translated(item.caption, 2000),
        alt: translated(item.alt || title, 500),
        category: item.category,
        date,
        order,
        credit: clean(item.credit, 500),
        sourceURL,
        status: item.status === "hidden" ? "hidden" : "published",
      };
    });
    return {
      schemaVersion: 1,
      updatedAt: clean(input.updatedAt, 60),
      models,
      publications,
      gallery,
    };
  }
  function place(model) {
    return model.locality || model.municipality || model.local || "";
  }
  function fallbackSource(input) {
    return (
      "window.GEOContentFallback = " +
      JSON.stringify(validate(input), null, 2)
        .replace(/</g, "\\u003c")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029") +
      ";\n"
    );
  }
  function locationText(model) {
    return [
      ...new Set(
        [
          model.locality,
          model.municipality,
          model.district,
          model.locationDetail,
          model.country,
        ].filter(Boolean),
      ),
    ].join(" · ");
  }
  function imageURL(model, root) {
    const path =
      model.image ||
      (/^https:\/\//i.test(model.img || "")
        ? model.img
        : model.img
          ? "modelos/images/" + model.img
          : "assets/model-placeholder.svg");
    if (global.GEODataPreviewImages?.[path]) return global.GEODataPreviewImages[path];
    return new URL(safePath(path) || "assets/model-placeholder.svg", root).href;
  }
  function geoResult(result) {
    const p = result?.features?.[0]?.properties;
    if (!p) return null;
    const locality = clean(p.city || p.town || p.village || p.district || p.name, 180);
    if (!locality) return null;
    return {
      locality,
      municipality: clean(p.city, 180),
      district: clean(p.county || p.state, 180),
      locationDetail: clean(p.district, 180),
      country: clean(p.country, 100),
      locationSource: "Photon / OpenStreetMap",
      locationConfirmed: false,
    };
  }
  let lastGeocode = 0,
    geocodeQueue = Promise.resolve();
  function reverseGeocode(lat, lng) {
    const run = async () => {
      const a = coordinate(lat, -90, 90),
        b = coordinate(lng, -180, 180);
      if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b))
        fail("Preenche a latitude e a longitude antes de procurar o local.");
      const key = `geods-place:${a.toFixed(6)},${b.toFixed(6)}`;
      try {
        const cached = JSON.parse(localStorage.getItem(key) || "null");
        if (cached && Date.now() - cached.at < 90 * 86400000) return cached.value;
      } catch {}
      const delay = Math.max(0, 1150 - (Date.now() - lastGeocode));
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      lastGeocode = Date.now();
      const url = new URL("https://photon.komoot.io/reverse");
      url.search = new URLSearchParams({ lat: String(a), lon: String(b), limit: "1" });
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        fail("O serviço de locais não respondeu. Podes preencher o local manualmente.");
      const value = geoResult(await response.json());
      if (!value)
        fail("Não foi encontrado um local para estas coordenadas. Podes preenchê-lo manualmente.");
      try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
      } catch {}
      return value;
    };
    const task = geocodeQueue.catch(() => {}).then(run);
    geocodeQueue = task;
    return task;
  }
  const api = {
    TYPES,
    GALLERY_TYPES,
    esc,
    normalise,
    clean,
    translated,
    text,
    safePath,
    externalURL,
    embedID,
    coordinate,
    validate,
    fallbackSource,
    place,
    locationText,
    imageURL,
    geoResult,
    reverseGeocode,
    uid,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (global) global.GEOContent = api;
})(typeof window !== "undefined" ? window : globalThis);
