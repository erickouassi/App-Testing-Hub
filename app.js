console.log("🔥 app.js loaded");

/* ---------------------------------------
   API BASE
--------------------------------------- */
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.adminhq.cf"
    : "";

/* ---------------------------------------
   DOM ELEMENTS
--------------------------------------- */
const appsContainer = document.getElementById("apps-container");
const loadingEl = document.getElementById("apps-loading");
const emptyEl = document.getElementById("apps-empty");
const appsCountLabel = document.getElementById("apps-count-label");
const refreshBtn = document.getElementById("refresh-btn");
const activityFilters = document.getElementById("activity-filters");

/* ---------------------------------------
   LOCAL STORAGE STATE
--------------------------------------- */
const STORAGE_KEY = "testingHubState";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { favorites: {}, likes: {}, joined: {}, completed: {}, saved: {} };
  } catch {
    return { favorites: {}, likes: {}, joined: {}, completed: {}, saved: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let userState = loadState();

/* ---------------------------------------
   GLOBAL STATE
--------------------------------------- */
let allApps = [];
let currentActivityFilter = "all";

/* ---------------------------------------
   STATE HELPERS
--------------------------------------- */
function toggleFlag(collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  renderApps();
}

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

/* ---------------------------------------
   UI HELPERS
--------------------------------------- */
function setLoading(isLoading) {
  if (loadingEl) loadingEl.classList.toggle("hidden", !isLoading);
}

function setEmpty(isEmpty) {
  if (emptyEl) emptyEl.classList.toggle("hidden", !isEmpty);
}

/* ---------------------------------------
   JOIN TEST FLOW
--------------------------------------- */
function joinTest(app) {
  const groupLink = app.groupLink?.trim();
  const testLink = app.testLink?.trim();

  if (!groupLink) {
    alert("This app requires joining the Google Group first.");
    return;
  }

  window.open(groupLink, "_blank");

  if (testLink) {
    setTimeout(() => {
      const proceed = confirm("After joining the Google Group, click OK to open the testing link.");
      if (proceed) window.open(testLink, "_blank");
    }, 1200);
  }

  if (app.slug) {
    userState.joined[app.slug] = true;
    saveState(userState);
    renderApps();
  }
}

/* ---------------------------------------
   LABEL HELPERS (Dynamic client-side calculation)
--------------------------------------- */
function formatDaysLabel(app) {
  const testingDuration = app.testingDuration ?? 25;

  if (!app.pubDate) {
    return `Day 1 of ${testingDuration}`;
  }

  try {
    const published = new Date(app.pubDate);
    if (isNaN(published.getTime())) {
      console.warn(`⚠️ Invalid pubDate for ${app.title}:`, app.pubDate);
      return `Day 1 of ${testingDuration}`;
    }

    const now = new Date();
    
    // Clear hours to guarantee accurate absolute day spans
    now.setHours(0, 0, 0, 0);
    published.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - published.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Testing timeline counts day of publication as Day 1
    const daysInTesting = Math.max(1, daysPassed + 1);

    console.log(`🔍 [formatDaysLabel] ${app.title} → Day ${daysInTesting} of ${testingDuration} (Calculated from ${app.pubDate})`);
    return `Day ${daysInTesting} of ${testingDuration}`;
  } catch (e) {
    return `Day 1 of ${testingDuration}`;
  }
}

function statusBadge(app) {
  const slug = app.slug || "";
  if (isFlagged("completed", slug))
    return `<span class="badge badge-status-completed">Completed</span>`;
  if (isFlagged("joined", slug))
    return `<span class="badge badge-status-joined">Joined</span>`;

  switch (app.status) {
    case "testing-completed":
      return `<span class="badge badge-status-completed">Testing completed</span>`;
    case "expired":
      return `<span class="badge badge-status-expired">Expired</span>`;
    default:
      return `<span class="badge badge-status-active">Open for testers</span>`;
  }
}

/* ---------------------------------------
   RENDER APPS
--------------------------------------- */
function renderApps() {
  if (!appsContainer) return;
  appsContainer.innerHTML = "";

  const appsToFilter = Array.isArray(allApps) ? allApps : [];

  let filtered = appsToFilter.filter((app) => {
    if (currentActivityFilter === "all") return true;
    return isFlagged(currentActivityFilter, app.slug);
  });

  if (appsCountLabel)
    appsCountLabel.textContent = `(${filtered.length} app${filtered.length === 1 ? "" : "s"})`;

  if (filtered.length === 0) {
    setEmpty(true);
    return;
  }

  setEmpty(false);

  filtered.forEach((app) => {
    const card = document.createElement("article");
    card.className = "app-card";
    const slug = app.slug || "";

    card.innerHTML = `
      <div class="app-header">
        <div>
          <div class="app-title">${app.title}</div>
          <div class="app-meta">Android • v${app.version}</div>
          <div class="app-badges">
            ${statusBadge(app)}
            ${isFlagged("favorites", slug) ? '<span class="badge">★ Favorite</span>' : ""}
          </div>
        </div>
      </div>

      <div class="app-description">${app.description}</div>

      <div class="app-footer">
        <div class="app-timing">${formatDaysLabel(app)}</div>
        <div class="app-actions">
          <a href="app.html?slug=${slug}" class="btn btn-ghost">Details</a>
          <button class="btn btn-primary" onclick='joinTest(${JSON.stringify(app).replace(/'/g, "&apos;")})'>Join test</button>
        </div>
      </div>
    `;

    appsContainer.appendChild(card);
  });
}

/* ---------------------------------------
   LOAD APPS (Dynamic Cross-Origin Cache Busting Routes)
--------------------------------------- */
async function loadApps() {
  console.log("🚀 [app.js] loadApps() started");
  setLoading(true);

  const API_URL =
    location.hostname === "127.0.0.1" || location.hostname === "localhost"
      ? `https://app-testing-hub.adminhq.cf/api/apps?t=${Date.now()}`
      : `/api/apps?t=${Date.now()}`;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    let appsList = [];

    if (data?.apps?.apps?.length) {
      appsList = data.apps.apps;
    } else if (data?.apps?.length) {
      appsList = data.apps;
    } else if (Array.isArray(data)) {
      appsList = data;
    } else {
      appsList = [];
    }

    allApps = appsList;
    console.log(`✅ Successfully loaded ${allApps.length} apps`);

    renderApps();
  } catch (err) {
    console.error("❌ Error loading apps:", err);
    setEmpty(true);
  } finally {
    setLoading(false);
    console.log("🏁 loadApps() completed");
  }
}

/* ---------------------------------------
   FILTERS & REFRESH
--------------------------------------- */
activityFilters?.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;

  currentActivityFilter = btn.getAttribute("data-filter");

  [...activityFilters.querySelectorAll(".filter-chip")].forEach((chip) =>
    chip.classList.toggle("active", chip === btn)
  );

  renderApps();
});

refreshBtn?.addEventListener("click", loadApps);

/* ---------------------------------------
   INITIAL LOAD
--------------------------------------- */
loadApps();