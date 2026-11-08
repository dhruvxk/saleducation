const schemas = {
  programs: { title: "Programs", label: "PROGRAMS", help: "Edit course names, levels, intakes and institute destinations.", fields: [ ["title", "Program title", "text"], ["level", "Study level", "select", ["diploma", "bachelor", "master", "doctoral"]], ["institute", "Institute", "text"], ["intake", "Published intake", "text"], ["url", "Institute URL", "url"] ] },
  notices: { title: "Admission notices", label: "ADMISSION NOTICES", help: "Update notice titles, institute labels, PDFs and current status notes.", fields: [ ["title", "Notice title", "text"], ["institute", "Institute", "text"], ["year", "Academic year", "text"], ["status", "Status / date note", "text"], ["url", "Official PDF URL", "url"] ] },
  news: { title: "News", label: "NEWS", help: "Manage public news cards and their source article links.", fields: [ ["title", "Headline", "text"], ["summary", "Summary", "textarea"], ["date", "Date or year", "text"], ["category", "Category", "text"], ["url", "Article URL", "url"], ["image", "Image URL", "url"] ] },
  events: { title: "Events", label: "EVENTS", help: "Manage event cards and dates shown in the campus calendar.", fields: [ ["title", "Event title", "text"], ["summary", "Summary", "textarea"], ["date", "Date (YYYY-MM-DD)", "date"], ["time", "Time", "text"], ["location", "Location", "text"], ["url", "Event URL", "url"] ] },
  resources: { title: "Resources", label: "RESOURCES", help: "Update the official resources directory grouped by section.", fields: [ ["title", "Resource title", "text"], ["section", "Section", "text"], ["description", "Description", "textarea"], ["url", "Official URL", "url"] ] }
};

const tabs = [...document.querySelectorAll("[data-collection]")];
const rows = document.querySelector("#admin-rows");
const alertBox = document.querySelector("#admin-alert");
const editor = document.querySelector("#content-editor");
const editorFields = document.querySelector("#editor-fields");
const editorError = document.querySelector("#editor-error");
const form = document.querySelector("#editor-form");
let collection = "programs";
let entries = [];
let editing = null;

const escapeText = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const fieldName = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (text) => text.toUpperCase());

function setAlert(message, tone = "info") {
  alertBox.textContent = message;
  alertBox.dataset.tone = tone;
  alertBox.hidden = false;
}

function renderRows() {
  const query = document.querySelector("#admin-search").value.trim().toLowerCase();
  const shown = entries.filter((entry) => `${entry.title} ${entry.institute || entry.section || entry.date || ""}`.toLowerCase().includes(query));
  rows.innerHTML = shown.map((entry) => {
    const details = entry.institute || entry.section || entry.location || entry.category || entry.level || "";
    return `<tr><td><strong>${escapeText(entry.title)}</strong><small>${escapeText(entry.url || "")}</small></td><td>${escapeText(details)}</td><td><span class="admin-status ${entry.published ? "is-published" : "is-hidden"}">${entry.published ? "Published" : "Draft"}</span></td><td>${escapeText(entry.updatedAt || "—")}</td><td class="admin-actions"><button type="button" data-edit="${escapeText(entry.id)}">Edit</button><button type="button" data-delete="${escapeText(entry.id)}">Delete</button></td></tr>`;
  }).join("");
  document.querySelector("#admin-empty").hidden = shown.length > 0;
  if (!shown.length) rows.innerHTML = `<tr class="admin-empty-row"><td colspan="5">${entries.length ? "No entries match this search." : "No content has been seeded yet."}</td></tr>`;
  rows.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openEditor(entries.find((item) => item.id === button.dataset.edit))));
  rows.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.delete)));
}

async function loadCollection() {
  const schema = schemas[collection];
  document.querySelector("#collection-title").textContent = schema.title;
  document.querySelector("#collection-label").textContent = schema.label;
  document.querySelector("#collection-help").textContent = schema.help;
  rows.innerHTML = `<tr><td colspan="5">Loading content…</td></tr>`;
  alertBox.hidden = true;
  try {
    const response = await fetch(`/api/admin/content?collection=${encodeURIComponent(collection)}`, { headers: { Accept: "application/json" } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Could not load content (${response.status}).`);
    entries = result;
    renderRows();
  } catch (error) {
    entries = [];
    rows.innerHTML = `<tr><td colspan="5">Content could not be loaded.</td></tr>`;
    setAlert(error.message || "Content could not be loaded. Check the D1 binding and Cloudflare Access setup.", "error");
  }
}

function openEditor(item = null) {
  editing = item;
  const schema = schemas[collection];
  document.querySelector("#editor-kicker").textContent = item ? `EDIT ${schema.label}` : `NEW ${schema.label}`;
  document.querySelector("#editor-title").textContent = item ? "Edit content" : "Add an item";
  editorError.textContent = "";
  editorFields.innerHTML = schema.fields.map(([key, label, type, options]) => {
    let control;
    if (type === "select") control = `<select name="${key}" required>${options.map((value) => `<option value="${value}" ${item?.[key] === value ? "selected" : ""}>${value}</option>`).join("")}</select>`;
    else if (type === "textarea") control = `<textarea name="${key}" rows="3">${escapeText(item?.[key] || "")}</textarea>`;
    else control = `<input name="${key}" type="${type}" value="${escapeText(item?.[key] || "")}" ${["title", "url"].includes(key) ? "required" : ""}>`;
    return `<label class="editor-field ${type === "textarea" ? "editor-wide" : ""}">${label}${control}</label>`;
  }).join("");
  document.querySelector("#field-published").checked = item ? item.published : true;
  document.querySelector("#field-sort-order").value = item?.sortOrder ?? 0;
  editor.showModal();
}

async function saveItem() {
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.published = document.querySelector("#field-published").checked;
  payload.sortOrder = Number(document.querySelector("#field-sort-order").value || 0);
  editorError.textContent = "";
  const url = `/api/admin/content?collection=${encodeURIComponent(collection)}${editing ? `&id=${encodeURIComponent(editing.id)}` : ""}`;
  try {
    const response = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "This item could not be saved.");
    editor.close();
    setAlert(editing ? "Changes saved." : "Item added.", "success");
    await loadCollection();
  } catch (error) {
    editorError.textContent = error.message || "This item could not be saved.";
  }
}

async function deleteItem(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry || !window.confirm(`Delete “${entry.title}”? This removes it from the content database.`)) return;
  try {
    const response = await fetch(`/api/admin/content?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "This item could not be deleted.");
    setAlert("Item deleted.", "success");
    await loadCollection();
  } catch (error) {
    setAlert(error.message || "This item could not be deleted.", "error");
  }
}

tabs.forEach((tab) => tab.addEventListener("click", () => {
  collection = tab.dataset.collection;
  tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
  document.querySelector("#admin-search").value = "";
  loadCollection();
}));
document.querySelector("#admin-search").addEventListener("input", renderRows);
document.querySelector("#add-item").addEventListener("click", () => openEditor());
document.querySelector("#refresh-items").addEventListener("click", loadCollection);
document.querySelector("#save-item").addEventListener("click", saveItem);
form.addEventListener("submit", (event) => { if (event.submitter?.value !== "close") event.preventDefault(); });
loadCollection();
