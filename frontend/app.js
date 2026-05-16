import { renderFilters, applyFilters } from "./ui/filters.js";
import { renderAppCard } from "./ui/card.js";
import { initLocalState } from "./state/local-state.js";

const appsContainer = document.getElementById("apps-container");
const loadingEl = document.getElementById("loading");
const emptyEl = document.getElementById("empty");

let allApps = [];
let activeFilters = {
  saved: false,
  joined: false,
  favorited: false,
  status: null
};

initLocalState();

async function fetchApps() {
  try {
    const res = await fetch("/api/apps");
    const data = await res.json();
    allApps = data.apps || [];
  } catch (e) {
    allApps = [];
  }
}

function renderApps() {
  appsContainer.innerHTML = "";
  if (!allApps.length) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  const filtered = applyFilters(allApps, activeFilters);

  if (!filtered.length) {
    emptyEl.classList.remove("hidden");
    return;
  }

  for (const app of filtered) {
    const card = renderAppCard(app);
    appsContainer.appendChild(card);
  }
}

function onFiltersChange(newFilters) {
  activeFilters = { ...activeFilters, ...newFilters };
  renderApps();
}

(async () => {
  renderFilters(onFiltersChange);
  await fetchApps();
  loadingEl.classList.add("hidden");
  renderApps();
})();
