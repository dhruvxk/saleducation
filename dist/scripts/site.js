const navToggle = document.querySelector(".mobile-menu-toggle");
const mainNav = document.querySelector("#primary-nav");

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  mainNav?.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});

mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
  mainNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}));

document.querySelectorAll(".nav-menu").forEach((menu) => menu.addEventListener("toggle", () => {
  if (menu.open) document.querySelectorAll(".nav-menu").forEach((other) => { if (other !== menu) other.open = false; });
}));

const courseSearch = document.querySelector("[data-course-search]");
let activeLevel = new URLSearchParams(location.search).get("level") || "all";
function updateCourseCards() {
  const cards = [...document.querySelectorAll(".course-card[data-search]")];
  if (!cards.length) return;
  const query = courseSearch?.value.trim().toLowerCase() || "";
  let visible = 0;
  cards.forEach((card) => {
    const matches = (activeLevel === "all" || card.dataset.level === activeLevel) && card.dataset.search.toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  const count = document.querySelector("[data-course-count]");
  if (count) count.textContent = `${visible} ${visible === 1 ? "program" : "programs"} shown`;
  const empty = document.querySelector("[data-course-empty]");
  if (empty) empty.hidden = visible !== 0;
}

function activateLevel(level) {
  activeLevel = level;
  document.querySelectorAll(".course-tab[data-filter]").forEach((tab) => {
    const selected = tab.dataset.filter === level;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  updateCourseCards();
}

document.querySelectorAll(".course-tab[data-filter]").forEach((tab) => tab.addEventListener("click", () => activateLevel(tab.dataset.filter)));
courseSearch?.addEventListener("input", updateCourseCards);
if (document.querySelector(".course-tab[data-filter]")) activateLevel(activeLevel);
document.addEventListener("cms:updated", updateCourseCards);

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && courseSearch) {
    event.preventDefault();
    courseSearch.focus();
    document.querySelector("#programs")?.scrollIntoView({ behavior: "smooth" });
  }
  if (event.key === "Escape") {
    document.querySelectorAll(".nav-menu[open]").forEach((menu) => { menu.open = false; });
    if (navToggle?.getAttribute("aria-expanded") === "true") navToggle.click();
  }
});

document.querySelectorAll("[data-mailto-form]").forEach((form) => form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const subject = `SAL admission inquiry — ${values.get("subject") || values.get("program")}`;
  const body = [
    `Name: ${values.get("name")}`,
    `Email: ${values.get("email")}`,
    `Mobile: ${values.get("mobile")}`,
    `City: ${values.get("city")}`,
    `Program of interest: ${values.get("program")}`,
    `Subject: ${values.get("subject") || "Not provided"}`,
    "",
    `Message: ${values.get("message") || "Not provided"}`
  ].join("\n");
  const note = form.querySelector("[data-form-note]");
  if (note) note.textContent = "Your email app should open with a draft to SAL admissions. Review it and press Send to complete the inquiry.";
  location.href = `mailto:admission@sal.edu.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}));
