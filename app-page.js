console.log("🔥 app-page.js loaded");

/* ---------------------------------------
   API BASE (Smart Detection for Local Testing vs Production)
--------------------------------------- */
const API_BASE_PAGE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

/* ---------------------------------------
   DOM + Local Storage
--------------------------------------- */
const container = document.getElementById("app-page-container");
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

window.toggleFlag = function (collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  loadAppPage();
};

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

function joinTestFlow(app) {
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
}

async function loadAppPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    container.innerHTML = "<div class='empty'>Error: No app slug provided in URL.</div>";
    return;
  }

  if (!container) return;
  container.innerHTML = "<div class='loading'>Loading app details...</div>";

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
        <div class='empty'>
          <h2>App not found</h2>
          <p><a href="index.html" class="btn btn-ghost">← Back to Apps</a></p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <article class="app-card">
        <div class="app-header">
          <div class="app-title">${app.title}</div>
          <div class="app-meta">Android • v${app.version || '1.0.0'}</div>
        </div>

        <div class="app-description" style="max-height:none; white-space:pre-wrap;">
          ${app.description || 'No description available.'}
        </div>

        <div class="app-info" style="margin: 15px 0;">
          <p><strong>Status:</strong> ${app.status || 'Open for testers'}</p>
          <p><strong>Days in testing:</strong> ${app.daysInTesting || 0}</p>
          <p><strong>Days left:</strong> ${app.daysLeft || 0}</p>
          <p><strong>Total testing duration:</strong> ${app.testingDuration || 0} days</p>

          ${app.languages?.length ? `<p><strong>Languages:</strong> ${app.languages.join(", ")}</p>` : ""}
          ${app.countries?.length ? `<p><strong>Countries:</strong> ${app.countries.join(", ")}</p>` : ""}
          ${app.requirements?.length ? `<p><strong>Requirements:</strong> ${app.requirements.join(", ")}</p>` : ""}
        </div>

        <div class="app-actions" style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost" onclick='toggleFlag("saved", "${slug}")'>
            ${isFlagged("saved", slug) ? "★ Unsave" : "☆ Save"}
          </button>
          <button class="btn btn-ghost" onclick='toggleFlag("joined", "${slug}")'>
            ${isFlagged("joined", slug) ? "Unmark joined" : "Mark joined"}
          </button>
          <button class="btn btn-ghost" onclick='toggleFlag("completed", "${slug}")'>
            ${isFlagged("completed", slug) ? "Undo completed" : "Mark completed"}
          </button>
          <button class="btn btn-primary" onclick='joinTestFlow(${JSON.stringify(app).replace(/'/g, "&apos;")})'>
            Join Test
          </button>
        </div>
      </article>
    `;
  } catch (err) {
    console.error("❌ Critical error loading app page:", err);
    container.innerHTML = `
      <div class='empty'>
        <p>Failed to load app details.</p>
        <a href="index.html" class="btn btn-ghost">← Back to Apps</a>
      </div>
    `;
  }
}

loadAppPage();