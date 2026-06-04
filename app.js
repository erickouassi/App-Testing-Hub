console.log("🚀 app.js: Universal Multi-Track Matrix Engine Loaded");

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const STORAGE_KEY = "testingHubState";
const appsContainer = document.getElementById("apps-container");
const filterContainer = document.getElementById("filter-container");

let allApps = [];
let currentFilter = "all";

// 1. Precise Hardware Platform Profiler
function isAndroidDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
}

// 2. Persisted State Handlers
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { favorites: {}, joined: {}, completed: {}, saved: {} };
  } catch {
    return { favorites: {}, joined: {}, completed: {}, saved: {} };
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

// 3. Automated Timeline Safety & Multi-Track Badging Engine
function getStatusBadgeMarkup(app, slug) {
  const days = parseInt(app.daysInTesting || 1);
  const duration = parseInt(app.testingDuration || 0);

  // Auto-trip completion badge on day overflow or explicit tracking flags
  if (isFlagged("completed", slug) || app.status === "testing-completed" || app.status === "completed" || (duration > 0 && days > duration)) {
    return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">✓ Completed</span>`;
  }
  if (app.status === "pre-registration") {
    return `<span class="badge badge-status-preregister" style="background-color: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">🗓️ Pre-Register</span>`;
  }
  if (isFlagged("joined", slug)) {
    return `<span class="badge badge-status-joined" style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Joined Track</span>`;
  }

  // Dynamic Google Program Track Namespaces Map
  const trackLabel = app.programType === "internal" ? "Internal Track" : app.programType === "open-beta" ? "Open Beta" : "Closed Track";
  return `<span class="badge badge-status-active" style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">🟢 ${trackLabel}</span>`;
}

// 4. Platform Action Routing Matrix
function getActionCardButtonMarkup(app, slug, escapedAppJson) {
  const isAndroid = isAndroidDevice();
  const testLink = app.testLink?.trim() || "#";
  const days = parseInt(app.daysInTesting || 1);
  const duration = parseInt(app.testingDuration || 0);
  const isOverTime = duration > 0 && days > duration;

  // STATE A: TESTING TRACK COMPLETED OR CYCLES EXCEEDED
  if (isFlagged("completed", slug) || app.status === "testing-completed" || app.status === "completed" || isOverTime) {
    if (isAndroid) {
      return `
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #2563eb; color: #fff; border:none; cursor: pointer; font-weight:500;" onclick="window.open('${testLink}', '_blank')">
          Launch URL
        </button>
      `;
    } else {
      return `
        <button class="btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #e5e7eb; color: #9ca3af; cursor: not-allowed; border: 1px solid #d1d5db;" disabled>
          Completed
        </button>
      `;
    }
  }

  // STATE B: GOOGLE PRE-REGISTRATION TRACK VARIATION
  if (app.status === "pre-registration") {
    return `
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #2563eb; color: #fff; border:none; cursor: pointer; font-weight:500;" onclick="window.open('${testLink}', '_blank')">
        Launch URL
      </button>
    `;
  }

  // STATE C: ACTIVE RE-ENGAGEMENT TRACKS (JOINED)
  if (isFlagged("joined", slug)) {
    if (isAndroid) {
      return `
        <button class="btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: transparent; border: 1px solid #2563eb; color: #2563eb; font-weight: 500; cursor: pointer;" onclick="universalProgramJoinFlow('${escapedAppJson}')">
          Open Links
        </button>
      `;
    } else {
      return `
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #2563eb; color: #fff; border:none; cursor: pointer; font-weight:500;" onclick="window.open('${testLink}', '_blank')">
          Launch URL
        </button>
      `;
    }
  }

  // STATE D: UNTOUCHED RECOGNITION DISCOVERY PIPELINES
  if (isAndroid) {
    return `
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #2563eb; color:#fff; border:none; cursor: pointer; font-weight:500;" onclick="universalProgramJoinFlow('${escapedAppJson}')">
        Join Test
      </button>
    `;
  } else {
    return `
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; background: #2563eb; color:#fff; border:none; cursor: pointer; font-weight:500;" onclick="window.open('${testLink}', '_blank')">
        Launch URL
      </button>
    `;
  }
}

// 5. Intelligent Automated Google Registration Bridge
window.universalProgramJoinFlow = function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();

    // Skip Group handshakes automatically for Open Betas / Track programs that don't use groups
    if (!groupLink || app.programType === "open-beta") {
      if (testLink) window.open(testLink, "_blank");
    } else {
      // Step 1: Fire Google Group membership page
      window.open(groupLink, "_blank");
      
      // Step 2: Trigger opt-in page prompt sequence
      if (testLink) {
        setTimeout(() => {
          const proceed = confirm("Google Group community page loaded. Click OK to advance to the official Google Play Testing Opt-in portal link.");
          if (proceed) window.open(testLink, "_blank");
        }, 1100);
      }
    }

    if (app.slug) {
      userState.joined[app.slug] = true;
      saveState(userState);
      renderApps();
    }
  } catch(e) {
    console.error("Universal Program Workflow Error:", e);
  }
};

// 6. Template Presentation Grid Matrix Renderer
function renderApps() {
  if (!appsContainer) return;

  const filteredApps = allApps.filter((app) => {
    if (!app || !app.slug) return false;
    const days = parseInt(app.daysInTesting || 1);
    const duration = parseInt(app.testingDuration || 0);
    const isCompleted = isFlagged("completed", app.slug) || app.status === "testing-completed" || app.status === "completed" || (duration > 0 && days > duration);

    if (currentFilter === "all") return true;
    if (currentFilter === "joined") return isFlagged("joined", app.slug) && !isCompleted;
    if (currentFilter === "completed") return isCompleted;
    if (currentFilter === "saved") return isFlagged("saved", app.slug);
    return true;
  });

  if (filteredApps.length === 0) {
    appsContainer.innerHTML = `<div class="empty" style="text-align: center; padding: 40px; color: #9ca3af;">No program tracks found matching the criteria.</div>`;
    return;
  }

  appsContainer.innerHTML = filteredApps.map((app) => {
    const slug = app.slug;
    const escapedAppJson = encodeURIComponent(JSON.stringify(app));
    
    const days = parseInt(app.daysInTesting || 1);
    const duration = parseInt(app.testingDuration || 0);
    const timelineLabel = (duration > 0 && days > duration) ? `Ended (${duration}d total)` : app.status === "pre-registration" ? "Pre-Release Phase" : `Day ${days} of ${duration || 14}`;

    // Density Target Counter Engine Scenario
    const memberCount = parseInt(app.groupMembers || 0);
    const densityIndicator = (memberCount < 20 && app.status !== "pre-registration") 
      ? `<span style="background: #fee2e2; color: #ef4444; font-size: 0.72rem; padding: 2px 6px; border-radius: 6px; font-weight:600;">🔥 ${20 - memberCount} needed</span>` 
      : `<span style="background: #d1fae5; color: #065f46; font-size:0.72rem; padding: 2px 6px; border-radius: 6px; font-weight:500;">✓ ${memberCount} testers</span>`;

    return `
      <div class="app-card" style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div>
          <div style="display: flex; gap: 12px; align-items: start; margin-bottom: 12px;">
            <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" 
                 alt="${app.title}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border:1px solid #e5e7eb;">
            <div style="flex: 1;">
              <h4 style="font-size: 1.05rem; font-weight: 600; margin: 0 0 2px 0; color: #111827;">${app.title}</h4>
              <div style="font-size: 0.78rem; color: #6b7280;">
                v${app.version || '1.0.0'} • <span style="color: #2563eb; font-weight: 500; text-transform: capitalize;">${app.programType || 'Closed'} Track</span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">
            ${getStatusBadgeMarkup(app, slug)}
            ${densityIndicator}
            ${isFlagged("saved", slug) ? '<span style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 6px; font-size: 0.72rem; font-weight: 500;">★</span>' : ""}
          </div>

          <p style="font-size: 0.85rem; color: #4b5563; line-height: 1.45; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${app.description || 'No operational release metadata mapped within tracking pipeline.'}
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem;">
          <span style="color: #6b7280; font-weight: 600;">${timelineLabel}</span>
          <div style="display: flex; gap: 6px;">
            <a href="app.html?slug=${slug}" style="padding: 6px 12px; font-size: 0.8rem; border: 1px solid #d1d5db; text-decoration: none; border-radius: 6px; color: #374151; font-weight:500; background:#fff;">Details</a>
            ${getActionCardButtonMarkup(app, slug, escapedAppJson)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupFilters() {
  if (!filterContainer) return;
  filterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    filterContainer.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter") || "all";
    renderApps();
  });
}

async function loadApps() {
  try {
    const res = await fetch(`${API_BASE}/api/apps?t=${Date.now()}`);
    const data = await res.json();
    allApps = data.apps || data;
    renderApps();
  } catch (err) {
    console.error("Critical Dash App Load Fetch Collapse:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  loadApps();
});