console.log("🔥 app-page.js loaded");

/* ---------------------------------------
   API BASE (local vs production - FIXED Option 1)
--------------------------------------- */
const API_BASE_PAGE = "";

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
  console.log("🚀 [app-page.js] loadAppPage() START");

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

    // Dynamic Live Day calculations computed instantly on page parse
    const testingDuration = app.testingDuration ?? 25;
    let liveDaysInTesting = 1;
    let liveDaysLeft = testingDuration;

    if (app.pubDate) {
      const published = new Date(app.pubDate);
      if (!isNaN(published.getTime())) {
        const now = new Date();
        now.setHours(0,0,0,0);
        published.setHours(0,0,0,0);
        
        const diffTime = now.getTime() - published.getTime();
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        liveDaysInTesting = Math.max(1, daysPassed + 1);
        liveDaysLeft = Math.max(0, testingDuration - liveDaysInTesting);
      }
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
          <p><strong>Status:</strong> ${liveDaysLeft > 0 ? (app.status || 'Open for testers') : 'Testing completed'}</p>
          <p><strong>Days in testing:</strong> ${liveDaysInTesting}</p>
          <p><strong>Days left:</strong> ${liveDaysLeft}</p>
          <p><strong>Total testing duration:</strong> ${testingDuration} days</p>

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