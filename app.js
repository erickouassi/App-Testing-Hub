console.log("🔥 app.js loaded");

/* ---------------------------------------
   API BASE (local vs production)
--------------------------------------- */
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
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
    return raw
      ? JSON.parse(raw)
      : { favorites: {}, likes: {}, joined: {}, completed: {}, saved: {} };
  } catch {
    return { favorites: {}, likes: {}, joined: {}, completed: {}, saved: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let userState = loadState();

/* ---------------------------------------
   GLOBAL APP STATE
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
      const proceed = confirm(
        "After joining the Google Group, click OK to open the testing link."
      );
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
   LABEL HELPERS
--------------------------------------- */
function formatDaysLabel(app) {
  const { daysInTesting = 0, daysLeft = 0, testingDuration = 0 } = app;
  if (testingDuration > 0) {
    return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in • ${daysLeft} day${daysLeft === 1 ? "" : "s"} left (${testingDuration} total)`;
  }
  return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in`;
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
    appsCountLabel.textContent = `(${filtered.length} app${
      filtered.length === 1 ? "" : "s"
    })`;

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
            ${
              isFlagged("favorites", slug)
                ? '<span class="badge">★ Favorite</span>'
                : ""
            }
          </div>
        </div>
      </div>

      <div class="app-description">${app.description}</div>

      <div class="app-footer">
        <div class="app-timing">${formatDaysLabel(app)}</div>
        <div class="app-actions">
          <a href="app.html?slug=${slug}" class="btn btn-ghost">Details</a>
          <button class="btn btn-primary" onclick='joinTest(${JSON.stringify(
            app
          )})'>Join test</button>
        </div>
      </div>
    `;

    appsContainer.appendChild(card);
  });
}

/* ---------------------------------------
   LOAD APPS FROM API
--------------------------------------- */
async function loadApps() {
  console.log("🚀 [app.js] loadApps() started");
  setLoading(true);

  const API_URL =
    location.hostname === "127.0.0.1" || location.hostname === "localhost"
      ? "https://app-testing-hub.vercel.app/api/apps"
      : "/api/apps";

  console.log("🌐 [app.js] Fetching from:", API_URL);

  try {
    const res = await fetch(API_URL);
    console.log("📡 [app.js] Response status:", res.status);

    const data = await res.json();
    console.log("📦 [app.js] Full API response:", JSON.stringify(data, null, 2));

    // === DEEP ROBUST PARSING ===
    let appsList = [];

    console.log("🔍 [app.js] Starting deep parsing...");

    if (data?.apps?.length) {
      console.log("✅ Path 1: data.apps is array");
      appsList = data.apps;
    } 
    else if (data?.apps?.apps?.length) {
      console.log("✅ Path 2: data.apps.apps is array (double nested)");
      appsList = data.apps.apps;
    } 
    else if (data?.apps && typeof data.apps === 'object') {
      console.log("✅ Path 3: data.apps is object → checking inner apps");
      if (Array.isArray(data.apps.apps)) {
        appsList = data.apps.apps;
        console.log("✅ Path 3a: Found inner apps array");
      } else if (Array.isArray(data.apps)) {
        appsList = data.apps;
      }
    } 
    else if (Array.isArray(data)) {
      console.log("✅ Path 4: Root is array");
      appsList = data;
    } 
    else {
      console.warn("⚠️ [app.js] Still unknown structure");
      console.log("Available keys at root:", Object.keys(data || {}));
      if (data?.apps) console.log("Keys inside data.apps:", Object.keys(data.apps || {}));
      appsList = [];
    }

    allApps = appsList;
    console.log(`✅ [app.js] Successfully loaded ${allApps.length} apps`);

    if (allApps.length === 0) {
      console.warn("⚠️ No apps loaded — check update.js on the server");
    }

    renderApps();
  } catch (err) {
    console.error("❌ [app.js] Error loading apps:", err);
    setEmpty(true);
  } finally {
    setLoading(false);
    console.log("🏁 [app.js] loadApps() completed");
  }
}
/* ---------------------------------------
   FILTERS
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

/* ---------------------------------------
   REFRESH BUTTON
--------------------------------------- */
refreshBtn?.addEventListener("click", loadApps);

/* ---------------------------------------
   INITIAL LOAD
--------------------------------------- */
loadApps();
