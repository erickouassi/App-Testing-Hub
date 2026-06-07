console.log("🔥 app.js loaded with refined device-state matrix and restored feed chips");

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const STORAGE_KEY = "testingHubState";
const appsContainer = document.getElementById("apps-container");
const filterContainer = document.getElementById("filter-container");

let allApps = [];
let currentFilter = "all";

// 1. Environment Detection Blueprint
function isAndroidDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
}

// 2. Theme Engine Core System Sync Logic
function initThemeEngine() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  toggleBtn.onclick = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };
}

// 3. Persisted Storage Utilities
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

// 4. Status Badge Generation
function getStatusBadgeMarkup(app, slug) {
  if (isFlagged("completed", slug)) {
    return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Completed</span>`;
  }
  if (isFlagged("joined", slug)) {
    return `<span class="badge badge-status-joined" style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Joined Track</span>`;
  }

  const normalizedStatus = (app.status || "").toLowerCase().trim();
  if (normalizedStatus === "testing-completed" || normalizedStatus === "production-live" || normalizedStatus === "production" || normalizedStatus === "stable") {
    return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">${normalizedStatus.includes('production') || normalizedStatus === 'stable' ? '🚀 Live' : 'Completed'}</span>`;
  }
  if (normalizedStatus === "expired") {
    return `<span class="badge badge-status-expired" style="background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Expired</span>`;
  }
  
  return `<span class="badge badge-status-active" style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Open for testers</span>`;
}

// 5. Precise Button State Machine Logic Matcher
function getActionCardButtonMarkup(app, slug, escapedAppJson) {
  const isAndroid = isAndroidDevice();
  const testLink = app.testLink?.trim() || "#";
  const normalizedStatus = (app.status || "").toLowerCase().trim();

  // STATE 1: TRACK COMPLETED / STABLE PRODUCTION
  if (isFlagged("completed", slug) || normalizedStatus === "testing-completed" || normalizedStatus === "production-live" || normalizedStatus === "production" || normalizedStatus === "stable" || normalizedStatus === "expired") {
    if (isAndroid) {
      const prodTarget = app.storeLink || app.fallbackUrl || testLink;
      return `
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;" onclick="window.open('${prodTarget}', '_blank')">
          Open App
        </button>
      `;
    } else {
      return `
        <button class="btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: var(--border); color: var(--muted); cursor: not-allowed; border: 1px solid var(--border);" disabled>
          Completed
        </button>
      `;
    }
  }

  // STATE 2: TRACK JOINED
  if (isFlagged("joined", slug)) {
    if (isAndroid) {
      return `
        <button class="btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: transparent; border: 1px solid var(--primary); color: var(--primary); font-weight: 500; cursor: pointer;" onclick="joinCardTestFlow('${escapedAppJson}')">
          Open Links
        </button>
      `;
    } else {
      return `
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
          Launch PWA Link
        </button>
      `;
    }
  }

  // STATE 3: OPEN FOR TESTING (DEFAULT UNTOUCHED)
  if (isAndroid) {
    return `
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;" onclick="joinCardTestFlow('${escapedAppJson}')">
        Join test
      </button>
    `;
  } else {
    return `
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
        Launch PWA Link
      </button>
    `;
  }
}

// 6. Automated Group / Invite + Install Sequence (Android-specific)
window.joinCardTestFlow = function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();
    const devEmail = app.developerEmail || app.email?.trim();

    // Contextual evaluation prioritizing community gateways first
    if (groupLink && groupLink.includes("groups.google.com")) {
      window.open(groupLink, "_blank");
      if (testLink) {
        setTimeout(() => {
          const proceed = confirm("After joining the Google Group community framework, click OK to open the official testing track link.");
          if (proceed) window.open(testLink, "_blank");
        }, 1200);
      }
    } else if (devEmail || groupLink) {
      const targetEmail = devEmail || groupLink;
      const mailSubject = encodeURIComponent(`[App Testing Hub] Request Invite: ${app.title || "App"}`);
      const mailBody = encodeURIComponent(`Hello,\n\nI would love to participate in the testing track for ${app.title || "your application"}. Please register my Google account to your list of testers.\n\nThank you!`);
      
      window.open(`mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}`, "_self");
      
      if (testLink) {
        setTimeout(() => {
          const proceed = confirm("Once you have sent your registration email invite request, click OK to preview the testing track access portal link.");
          if (proceed) window.open(testLink, "_blank");
        }, 1200);
      }
    } else {
      // Direct access backup path if no group onboarding parameters exist
      if (testLink) window.open(testLink, "_blank");
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

// 7. App Render Templates Engine
function renderApps() {
  if (!appsContainer) return;

  const filteredApps = allApps.filter((app) => {
    if (!app || !app.slug) return false;
    if (currentFilter === "all") return true;
    if (currentFilter === "joined") return isFlagged("joined", app.slug);
    if (currentFilter === "completed") return isFlagged("completed", app.slug) || app.status === "testing-completed" || app.status === "production-live" || app.status === "production" || app.status === "stable";
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
    
    const dynamicFeedUrl = app.feedUrl || app.feedSourceUrl || `${API_BASE}/api/feed.xml?slug=${app.slug}`;

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
            
            <a href="${dynamicFeedUrl}" target="_blank" class="filter-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.75rem; border-radius: 12px; text-decoration: none; font-weight: 500; background: var(--bg); color: var(--text); border: 1px solid var(--border);">
              📡 Follow App Feed XML
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
            ${getActionCardButtonMarkup(app, slug, escapedAppJson)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 8. Navigation Filters Engine
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

// 9. Data Loading Initializer (Deduplicated Structure)
// 9. Data Loading Initializer (Status & Feed Aware Deduplication)
async function loadApps() {
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  try {
    const API_URL = `${API_BASE}/api/apps?t=${Date.now()}`;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    let rawAppsList = [];

    // 1. Safely extract the raw payload variants from your API
    if (data && Array.isArray(data.apps)) {
      rawAppsList = data.apps;
    } else if (data && data.apps && Array.isArray(data.apps.apps)) {
      rawAppsList = data.apps.apps;
    } else if (Array.isArray(data)) {
      rawAppsList = data;
    } else if (data && typeof data === 'object' && data.apps) {
      rawAppsList = Array.isArray(data.apps.apps) ? data.apps.apps : [];
    }

    // 2. STATUS & CHANNEL FILTER ENGINE
    const uniqueAppsMap = new Map();
    
    rawAppsList.forEach(app => {
      if (!app || !app.slug) return;

      const cleanSlug = app.slug.trim().toLowerCase();
      const normalizedStatus = (app.status || "").toLowerCase().trim();

      // Skip historical items or updates that shouldn't show up on the main channel tracker
      if (
        normalizedStatus === "hidden" || 
        normalizedStatus === "draft" || 
        normalizedStatus === "archived"
      ) {
        return;
      }

      // If an entry for this app already exists, prioritize the one with an active testing track configuration
      if (uniqueAppsMap.has(cleanSlug)) {
        const existingApp = uniqueAppsMap.get(cleanSlug);
        const existingStatus = (existingApp.status || "").toLowerCase().trim();

        // If the new item has a higher-priority testing status than the old duplicate item, overwrite it
        if (
          (normalizedStatus === "open-testing" || normalizedStatus === "closed-testing" || normalizedStatus === "testing") &&
          !(existingStatus === "open-testing" || existingStatus === "closed-testing" || existingStatus === "testing")
        ) {
          uniqueAppsMap.set(cleanSlug, app);
        }
      } else {
        // First time seeing this slug, add it directly
        uniqueAppsMap.set(cleanSlug, app);
      }
    });

    // 3. Commit exactly the unique, channel-valid tracks back to the UI pipeline
    allApps = Array.from(uniqueAppsMap.values());

    console.log(`🎯 Filtered deduplication complete. Rendering exactly ${allApps.length} live track apps.`);
    renderApps();

  } catch (err) {
    console.error("❌ Critical breakdown error processing apps feed:", err);
    if (appsContainer) {
      appsContainer.innerHTML = `<div class="empty" style="color: red;">Failed to parse application dashboard safely.</div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  setupFilters();
  loadApps();
});