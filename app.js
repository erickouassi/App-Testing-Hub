console.log("🔥 app.js loaded");

// Configuration and state management
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const STORAGE_KEY = "testingHubState";
const appsContainer = document.getElementById("apps-container");
const filterContainer = document.getElementById("filter-container");

let allApps = [];
let currentFilter = "all";

// 1. Theme Engine Core System Sync Logic
function initThemeEngine() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) {
    console.warn("⚠️ [Theme Engine] #theme-toggle button not found in current DOM.");
    return;
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  toggleBtn.onclick = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    console.log(`🌓 [Theme Engine] Theme switched to: ${newTheme}`);
  };
}

// 2. Persisted Storage Utilities
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

window.toggleCardFlag = function (collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  renderApps(); 
};

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

// 3. Status Badge Generation
function getStatusBadgeMarkup(app, slug) {
  if (isFlagged("completed", slug)) {
    return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Completed</span>`;
  }
  if (isFlagged("joined", slug)) {
    return `<span class="badge badge-status-joined" style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Joined Track</span>`;
  }

  switch (app.status) {
    case "testing-completed":
    case "production-live":
      return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">${app.status === 'production-live' ? '🚀 Live' : 'Completed'}</span>`;
    case "expired":
      return `<span class="badge badge-status-expired" style="background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Expired</span>`;
    default:
      return `<span class="badge badge-status-active" style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Open for testers</span>`;
  }
}

// 4. Automated Testing Flow Actions Matrix
window.joinCardTestFlow = function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();

    if (!groupLink) {
      alert("This application requires joining a Google Group workspace framework first.");
      return;
    }

    window.open(groupLink, "_blank");

    if (testLink) {
      setTimeout(() => {
        const proceed = confirm("After joining the Google Group, click OK to open the testing pipeline link.");
        if (proceed) window.open(testLink, "_blank");
      }, 1200);
    }

    if (app.slug) {
      userState.joined[app.slug] = true;
      saveState(userState);
      renderApps();
    }
  } catch(e) {
    console.error("Error executing dynamic test stream routing:", e);
  }
};

// 5. App Render Templates Engine
function renderApps() {
  if (!appsContainer) return;

  const filteredApps = allApps.filter((app) => {
    if (!app || !app.slug) return false;
    if (currentFilter === "all") return true;
    if (currentFilter === "joined") return isFlagged("joined", app.slug);
    if (currentFilter === "completed") return isFlagged("completed", app.slug) || app.status === "testing-completed" || app.status === "production-live";
    if (currentFilter === "saved") return isFlagged("saved", app.slug);
    return true;
  });

  if (filteredApps.length === 0) {
    appsContainer.innerHTML = `
      <div class="empty" style="text-align: center; padding: 40px var(--padding); grid-column: 1 / -1; color: var(--muted);">
        No applications found matching the selected track criteria filters.
      </div>
    `;
    return;
  }

  appsContainer.innerHTML = filteredApps.map((app) => {
    const slug = app.slug;
    const escapedAppJson = encodeURIComponent(JSON.stringify(app));
    const durationLabel = app.testingDuration ? `Day ${app.daysInTesting || 1} of ${app.testingDuration}` : `Day ${app.daysInTesting || 1} in testing`;

    // DECENTRALIZED FIX: Point directly to the untouched external feed source URL
    const dynamicFeedUrl = app.feedSourceUrl || "#";

    return `
      <div class="app-card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
        <div>
          <div style="display: flex; gap: 12px; align-items: start; margin-bottom: 12px;">
            <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" 
                 alt="${app.title}" 
                 style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; background: #0b4cb4; border: 1px solid var(--border);">
            <div style="flex: 1;">
              <h4 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 2px 0; color: var(--text); line-height: 1.3;">${app.title}</h4>
              <div style="font-size: 0.78rem; color: var(--muted);">
                v${app.version || '1.0.0'} • <span style="color: var(--primary); font-weight: 500;">${app.category || 'General'}</span> • ${app.price || 'Free'}
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">
            ${getStatusBadgeMarkup(app, slug)}
            ${isFlagged("saved", slug) ? '<span class="badge" style="background: #e6c200; color: #111; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 500;">★ Favorite</span>' : ""}
            
            <a href="${dynamicFeedUrl}" target="_blank" title="Subscribe to original source feed XML directly from the developer" style="display: inline-flex; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; text-decoration: none; align-items: center; gap: 2px;">
               📡 RSS
            </a>
          </div>

          <p style="font-size: 0.88rem; color: var(--text); opacity: 0.85; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16px; margin-top: 4px;">
            ${app.description || 'No additional deployment tracking criteria profiles provided.'}
          </p>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 14px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <span style="color: var(--muted); font-weight: 500;">${durationLabel}</span>
          <div style="display: flex; gap: 6px;">
            <a href="app.html?slug=${slug}" class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.8rem; border: 1px solid var(--border); text-decoration: none; border-radius: 6px; display: inline-block;">Details</a>
            <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px;" onclick="joinCardTestFlow('${escapedAppJson}')">Join test</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 6. Navigation Filters Registration Engine
function setupFilters() {
  if (!filterContainer) return;

  filterContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest(".filter-chip");
    if (!targetButton) return;

    filterContainer.querySelectorAll(".filter-chip").forEach((btn) => btn.classList.remove("active"));
    targetButton.classList.add("active");
    currentFilter = targetButton.getAttribute("data-filter") || "all";
    
    renderApps();
  });
}

// 7. Data Fetch Asynchronous Initialization
async function loadApps() {
  console.log("🚀 [app.js] loadApps() started");
  
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  try {
    const API_URL = `${API_BASE}/api/apps?t=${Date.now()}`;
    const res = await fetch(API_URL);

    if (!res.ok) throw new Error(`HTTP error structure! Status context: ${res.status}`);

    const data = await res.json();
    
    if (data && Array.isArray(data.apps)) {
      allApps = data.apps;
    } else if (data && data.apps && Array.isArray(data.apps.apps)) {
      allApps = data.apps.apps;
    } else if (Array.isArray(data)) {
      allApps = data;
    } else if (data && typeof data === 'object' && data.apps) {
      allApps = Array.isArray(data.apps.apps) ? data.apps.apps : [];
    }

    console.log(`✅ Successfully loaded ${allApps.length} apps`);
    renderApps();
  } catch (err) {
    console.error("❌ Critical breakdown error processing apps array feed node stack:", err);
    if (appsContainer) {
      appsContainer.innerHTML = `<div class="empty" style="color: red;">Failed to safely parse platform architecture components. Please retry later.</div>`;
    }
  }
}

// 8. Dom Lifecycle Hook Deployments Execution
document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  setupFilters();
  loadApps();
});

if (document.readyState === "interactive" || document.readyState === "complete") {
  initThemeEngine();
  setupFilters();
  loadApps();
}