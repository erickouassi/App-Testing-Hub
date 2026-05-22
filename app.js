console.log("🔥 app.js loaded");

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const appsContainer = document.getElementById("apps-container");
const loadingEl = document.getElementById("apps-loading");
const emptyEl = document.getElementById("apps-empty");
const appsCountLabel = document.getElementById("apps-count-label");
const refreshBtn = document.getElementById("refresh-btn");
const activityFilters = document.getElementById("activity-filters");

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
let allApps = [];
let currentActivityFilter = "all";

function toggleFlag(collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  renderApps();
}

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

function setLoading(isLoading) {
  if (loadingEl) loadingEl.classList.toggle("hidden", !isLoading);
}

function setEmpty(isEmpty) {
  if (emptyEl) emptyEl.classList.toggle("hidden", !isEmpty);
}

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

function formatDaysLabel(app) {
  const { daysInTesting = 1, testingDuration = 0 } = app;
  if (testingDuration > 0) {
    return `Day ${daysInTesting} of ${testingDuration}`;
  }
  return `Day ${daysInTesting} in testing`;
}

function statusBadge(app) {
  const slug = app.slug || "";
  if (isFlagged("completed", slug))
    return `<span class="badge badge-status-completed">Completed</span>`;
  if (isFlagged("joined", slug))
    return `<span class="badge badge-status-joined">Joined</span>`;

  switch (app.status) {
    case "testing-completed":
    case "production-live":
      return `<span class="badge badge-status-completed">${app.status === 'production-live' ? '🚀 Live' : 'Testing completed'}</span>`;
    case "expired":
      return `<span class="badge badge-status-expired">Expired</span>`;
    default:
      return `<span class="badge badge-status-active">Open for testers</span>`;
  }
}

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

  const openApps = filtered.filter(app => app.status !== "testing-completed" && app.status !== "expired" && app.status !== "production-live");
  const completedApps = filtered.filter(app => app.status === "testing-completed" || app.status === "expired" || app.status === "production-live");

  openApps.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  completedApps.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  const sortedApps = [...openApps, ...completedApps];

  sortedApps.forEach((app) => {
    const card = document.createElement("article");
    card.className = "app-card";
    if (app.status === "testing-completed" || app.status === "expired" || app.status === "production-live") {
      card.classList.add("card-completed");
    }
    const slug = app.slug || "";

    card.innerHTML = `
      <div class="app-header" style="display: flex; gap: 12px; align-items: start;">
        <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" alt="${app.title} icon" class="app-icon" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #eee;">
        <div style="flex: 1;">
          <div class="app-title">${app.title}</div>
          <div class="app-meta">v${app.version} • <span class="dir-category" style="opacity: 0.85; font-weight: 500;">${app.category || 'General'}</span> • <span class="dir-price" style="font-weight: 500;">${app.price || 'Free'}</span></div>
          <div class="app-badges" style="margin-top: 4px;">
            ${statusBadge(app)}
            ${isFlagged("favorites", slug) ? '<span class="badge">★ Favorite</span>' : ""}
          </div>
        </div>
      </div>

      <div class="app-description" style="margin-top: 10px;">${app.description}</div>

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

async function loadApps() {
  console.log("🚀 [app.js] loadApps() started");
  setLoading(true);

  const API_URL = `${API_BASE}/api/apps?t=${Date.now()}`;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    let appsList = [];

    if (data?.apps?.apps?.length) {
      appsList = data.apps.apps;
    } else if (data?.apps?.length) {
      appsList = data.apps;
    } else if (Array.isArray(data)) {
      data.forEach(item => {
         if (item?.apps && Array.isArray(item.apps)) {
            appsList = appsList.concat(item.apps);
         } else {
            appsList.push(item);
         }
      });
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
loadApps();