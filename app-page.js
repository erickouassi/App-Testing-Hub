console.log("🔥 app-page.js loaded");

/* ---------------------------------------
   API BASE (local vs production)
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
   Global toggle for Save / Joined / Completed
--------------------------------------- */
window.toggleFlag = function (collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  loadAppPage();
};

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

/* ---------------------------------------
   Join Test (Google Group → Testing Link)
--------------------------------------- */
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
      const proceed = confirm(
        "After joining the Google Group, click OK to open the testing link."
      );
      if (proceed) window.open(testLink, "_blank");
    }, 1200);
  }

  // Mark as joined
  if (app.slug) {
    userState.joined[app.slug] = true;
    saveState(userState);
    loadAppPage();
  }
}

/* ---------------------------------------
   Load App Details Page
--------------------------------------- */
async function loadAppPage() {
  console.log("🚀 [app-page.js] ================== loadAppPage() START ==================");

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  
  console.log("🔑 [app-page.js] URL slug requested:", slug);
  console.log("📍 [app-page.js] Current URL:", window.location.href);

  if (!slug) {
    console.error("❌ [app-page.js] No slug found in URL");
    container.innerHTML = "<div class='empty'>Error: No app slug provided in URL.</div>";
    return;
  }

  if (!container) {
    console.error("❌ [app-page.js] Container element not found");
    return;
  }

  container.innerHTML = "<div class='loading'>Loading app details...</div>";

  try {
    const API_URL = `${API_BASE_PAGE}/api/apps`;
    console.log("🌐 [app-page.js] Fetching from:", API_URL);

    const res = await fetch(API_URL);
    console.log("📡 [app-page.js] Response status:", res.status, res.statusText);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("📦 [app-page.js] Full API response received:", data);

    // === ROBUST PARSING WITH DETAILED LOGS ===
    let appsList = [];

    console.log("🔍 [app-page.js] Starting response parsing...");

    if (data && Array.isArray(data.apps)) {
      console.log("✅ [app-page.js] Path 1: data.apps is array");
      appsList = data.apps;
    } 
    else if (data && data.apps && Array.isArray(data.apps.apps)) {
      console.log("✅ [app-page.js] Path 2: data.apps.apps (double nested)");
      appsList = data.apps.apps;
    } 
    else if (Array.isArray(data)) {
      console.log("✅ [app-page.js] Path 3: Root level is array");
      appsList = data;
    } 
    else if (data && typeof data === 'object' && data.apps) {
      console.log("✅ [app-page.js] Path 4: data.apps is object, trying to extract");
      appsList = Array.isArray(data.apps.apps) ? data.apps.apps : [];
    } 
    else {
      console.warn("⚠️ [app-page.js] Unknown response structure");
      console.log("📋 Full data keys:", Object.keys(data || {}));
      appsList = [];
    }

    console.log(`📊 [app-page.js] Total apps parsed: ${appsList.length}`);

    // Find the specific app
    const app = appsList.find((a) => a && a.slug === slug);
    
    if (!app) {
      console.error(`❌ [app-page.js] App with slug "${slug}" NOT FOUND`);
      console.log("📋 Available slugs:", appsList.map(a => a?.slug).filter(Boolean));
      
      container.innerHTML = `
        <div class='empty'>
          <h2>App not found</h2>
          <p>Could not find app with slug: <strong>${slug}</strong></p>
          <p><a href="index.html" class="btn btn-ghost">← Back to Apps</a></p>
        </div>
      `;
      return;
    }

    console.log("✅ [app-page.js] App found:", app.title);
    console.log("📋 App details:", {
      title: app.title,
      version: app.version,
      daysInTesting: app.daysInTesting,
      daysLeft: app.daysLeft,
      slug: app.slug
    });

    // Render the app details
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

          <button class="btn btn-primary" onclick='joinTestFlow(${JSON.stringify(app)})'>
            Join Test
          </button>
        </div>
      </article>
    `;

    console.log("✅ [app-page.js] App details rendered successfully");

  } catch (err) {
    console.error("❌ [app-page.js] Critical error loading app page:", err);
    container.innerHTML = `
      <div class='empty'>
        <p>Failed to load app details.</p>
        <p>Error: ${err.message}</p>
        <a href="index.html" class="btn btn-ghost">← Back to Apps</a>
      </div>
    `;
  } finally {
    console.log("🏁 [app-page.js] ================== loadAppPage() FINISHED ==================");
  }
}

loadAppPage();
