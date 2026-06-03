console.log("🔥 app-page.js loaded with Theme & App-RSS Sync engines");

const API_BASE_PAGE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const container = document.getElementById("app-page-container");
const STORAGE_KEY = "testingHubState";

function initThemeEngine() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

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

window.toggleFlag = function (collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  loadAppPage();
};

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

function statusBadge(app, slug) {
  if (isFlagged("completed", slug))
    return `<span class="badge badge-status-completed" style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Completed</span>`;
  if (isFlagged("joined", slug))
    return `<span class="badge badge-status-joined" style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Joined Track</span>`;

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

window.joinTestFlow = function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
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
      loadAppPage();
    }
  } catch(e) {
    console.error("Error launching joint flow structure:", e);
  }
};

async function loadAppPage() {
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    if (container) container.innerHTML = "<div class='empty'>Error: No app slug provided in URL.</div>";
    return;
  }

  if (!container) return;

  try {
    const API_URL = `${API_BASE_PAGE}/api/apps?t=${Date.now()}`;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    let appsList = [];

    if (data && Array.isArray(data.apps)) {
      appsList = data.apps;
    } else if (data && data.apps && Array.isArray(data.apps.apps)) {
      appsList = data.apps.apps;
    } else if (Array.isArray(data)) {
      appsList = data;
    } else if (data && typeof data === 'object' && data.apps) {
      appsList = Array.isArray(data.apps.apps) ? data.apps.apps : [];
    }

    const app = appsList.find((a) => a && a.slug === slug);
    if (!app) {
      container.innerHTML = `
        <div class='empty' style="text-align: center; padding: 40px 20px;">
          <h2>App listing was not found</h2>
          <p style="margin-top:12px;"><a href="index.html" class="btn btn-ghost">← Back to Apps</a></p>
        </div>
      `;
      return;
    }

    const escapedAppJson = encodeURIComponent(JSON.stringify(app));

    // CONSUMES PARSED FIELD: Direct standalone target routing, with query tracking as a fallback.
    const dynamicFeedUrl = app.feedUrl || `${API_BASE_PAGE}/api/feed.xml?slug=${app.slug}`;

    const joinArray = (arr) => {
      if(!arr || arr.length === 0) return "Global / Unspecified";
      return arr.join(", ");
    };

    container.innerHTML = `
      <article style="font-family: system-ui, -apple-system, sans-serif;">
        
        <div class="app-header" style="display: flex; gap: 16px; align-items: start; margin-bottom: 24px;">
          <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" 
               alt="${app.title}" 
               style="width: 72px; height: 72px; border-radius: 16px; object-fit: cover; background: #0b4cb4; border: 1px solid var(--border);">
          <div style="flex: 1; padding-top: 2px;">
            <div class="app-title" style="font-size: 1.75rem; font-weight: 600; color: var(--text); margin-bottom: 2px; letter-spacing: -0.02em; line-height: 1.2;">${app.title}</div>
            <div class="app-meta" style="font-size: 0.875rem; color: var(--muted); margin-bottom: 2px;">
              Category: ${app.category || 'General'} • Price: ${app.price || 'Free'}
            </div>
            <div style="font-size: 0.875rem; color: var(--muted);">
              Android • v${app.version || '1.0.0'}
            </div>
          </div>
        </div>

        <div class="app-badges" style="margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          ${statusBadge(app, slug)}
          ${isFlagged("saved", slug) ? '<span class="badge" style="background: #e6c200; color: #111; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">★ Favorited</span>' : ""}
          
          <a href="${dynamicFeedUrl}" target="_blank" class="filter-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.75rem; border-radius: 12px; text-decoration: none; font-weight: 500;">
            📡 Follow App Feed XML
          </a>
        </div>

        <div class="app-description" style="font-size: 1rem; line-height: 1.5; color: var(--text); opacity: 0.85; margin: 32px 0; text-align: center; padding: 0 16px;">
          ${app.description || 'A profile tracking open metrics for this packaging instance setup.'}
        </div>

        <div class="spec-blueprint-box">
          <div><strong>Track Status:</strong> <span>${app.status === 'production-live' ? 'Live-Production' : 'Open-Testing'}</span></div>
          <div><strong>Days in testing:</strong> <span>${app.daysInTesting || 1}</span></div>
          <div><strong>Days left:</strong> <span>${app.daysLeft !== undefined ? app.daysLeft : '5'}</span></div>
          <div><strong>Total testing duration:</strong> <span>${app.testingDuration || '25'} days</span></div>
          <div><strong>Languages:</strong> <span>${joinArray(app.languages)}</span></div>
          <div><strong>Countries:</strong> <span>${joinArray(app.countries)}</span></div>
          <div><strong>Requirements:</strong> <span>${joinArray(app.requirements)}</span></div>
        </div>

        <div class="app-actions" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding-top: 12px; border-top: 1px solid var(--border);">
          <button class="btn btn-ghost" style="border: 1px solid var(--border);" onclick='toggleFlag("saved", "${slug}")'>
            ${isFlagged("saved", slug) ? "★ Unsave" : "☆ Save Favorite"}
          </button>
          <button class="btn btn-ghost" style="border: 1px solid var(--border);" onclick='toggleFlag("joined", "${slug}")'>
            ${isFlagged("joined", slug) ? "Unmark joined" : "Mark Joined"}
          </button>
          <button class="btn btn-ghost" style="border: 1px solid var(--border);" onclick='toggleFlag("completed", "${slug}")'>
            ${isFlagged("completed", slug) ? "Undo completed" : "Mark Completed"}
          </button>
          <span style="flex-grow: 1;"></span>
          <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 500; font-size: 0.92rem;" onclick="joinTestFlow('${escapedAppJson}')">
            Join Test
          </button>
        </div>
      </article>
    `;
  } catch (err) {
    console.error("❌ Critical error loading app page details node:", err);
    container.innerHTML = `
      <div class='empty' style="text-align: center; padding: 40px 20px;">
        <p>Failed to parse application index matrix dynamically.</p>
        <a href="index.html" class="btn btn-ghost" style="margin-top:12px;">← Back to Directory</a>
      </div>
    `;
  }
}

initThemeEngine();
loadAppPage();