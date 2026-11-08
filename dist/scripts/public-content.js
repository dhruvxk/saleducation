const escapeText = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const safeLink = (value = "") => {
  try {
    const url = new URL(value, location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
};
const levelLabels = { diploma: "Diploma", bachelor: "Bachelor", master: "Master", doctoral: "Doctoral" };
const dateLabel = (date) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(parsed.valueOf()) ? escapeText(date || "") : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

const renderers = {
  programs: (items, container) => {
    const level = container.dataset.level || "all";
    const institute = container.dataset.institute || "";
    const filtered = items.filter((item) => (level === "all" || item.level === level) && (!institute || item.institute === institute));
    const limit = Number(container.dataset.cmsLimit || 0);
    const shown = limit ? filtered.slice(0, limit) : filtered;
    container.innerHTML = shown.map((item) => `<a class="course-card" href="${safeLink(item.url)}" target="_blank" rel="noopener" data-level="${escapeText(item.level)}" data-search="${escapeText(`${item.title} ${item.institute} ${item.level}`)}"><div class="course-card-top"><span class="course-level">${escapeText(levelLabels[item.level] || "Program")} degree</span><span class="course-intake">${escapeText(item.intake || "See institute")}</span></div><h3>${escapeText(item.title)}</h3><div class="course-card-bottom"><span>${escapeText(item.institute)}</span><b aria-hidden="true">↗</b></div></a>`).join("");
  },
  notices: (items, container) => {
    const limit = Number(container.dataset.cmsLimit || 0);
    const shown = limit ? items.slice(0, limit) : items;
    container.innerHTML = shown.map((item, index) => `<a class="notice-item" href="${safeLink(item.url)}" target="_blank" rel="noopener"><span class="notice-num">${String(index + 1).padStart(2, "0")}</span><span class="notice-title">${escapeText(item.title)}<span class="notice-tag">${escapeText(item.institute)} · ${escapeText(item.status)}</span></span><b aria-hidden="true">↗</b></a>`).join("");
  },
  news: (items, container) => {
    const limit = Number(container.dataset.cmsLimit || 0);
    const shown = limit ? items.slice(0, limit) : items;
    container.innerHTML = shown.map((item, index) => `<article class="story-card ${index === 0 ? "story-featured" : ""}"><a class="story-image" href="${safeLink(item.url)}" target="_blank" rel="noopener"><img src="${safeLink(item.image)}" alt="" loading="lazy"><span class="story-category">${escapeText(item.category)}</span><span class="story-arrow">↗</span></a><div class="story-copy"><span class="story-meta">SAL Education · ${escapeText(item.date)}</span><h3>${escapeText(item.title)}</h3><p>${escapeText(item.summary)}</p><a href="${safeLink(item.url)}" target="_blank" rel="noopener">Read the story <span aria-hidden="true">↗</span></a></div></article>`).join("");
  },
  events: (items, container) => {
    const limit = Number(container.dataset.cmsLimit || 0);
    const shown = limit ? items.slice(0, limit) : items;
    container.innerHTML = shown.map((item) => {
      const formatted = dateLabel(item.date).split(" ");
      return `<article class="event-card"><div class="event-date"><span>${escapeText(formatted[1] || "")}</span><b>${escapeText(formatted[0] || "")}</b><small>${escapeText(formatted[2] || "")}</small></div><div class="event-copy"><span class="story-meta">${escapeText(item.location)} · ${escapeText(item.time)}</span><h2>${escapeText(item.title)}</h2><p>${escapeText(item.summary)}</p><a href="${safeLink(item.url)}" target="_blank" rel="noopener">Event archive <span aria-hidden="true">↗</span></a></div></article>`;
    }).join("");
  },
  resources: (items, container) => {
    const section = container.dataset.section || "";
    container.innerHTML = items.filter((item) => item.section === section).map((item) => `<a class="resource-card" href="${safeLink(item.url)}" target="_blank" rel="noopener"><span class="resource-card-mark">↗</span><span class="resource-card-title">${escapeText(item.title)}</span><span class="resource-card-description">${escapeText(item.description)}</span></a>`).join("");
  }
};

document.querySelectorAll("[data-cms-list]").forEach(async (container) => {
  const collection = container.dataset.cmsList;
  if (!renderers[collection]) return;
  try {
    const response = await fetch(`/api/content?collection=${encodeURIComponent(collection)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const items = await response.json();
    if (!Array.isArray(items) || items.length === 0) return;
    renderers[collection](items, container);
    document.dispatchEvent(new CustomEvent("cms:updated", { detail: { collection } }));
  } catch {
    // The static build remains visible when the optional D1 content API is unavailable.
  }
});
