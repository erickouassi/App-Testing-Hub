console.log("🔥 app-page.js loaded");

const API_BASE_PAGE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const container = document.getElementById("app-page-container");

function joinTest(url) {
  if (!url) {
    alert("This app requires joining the Google Group first. No group link found.");
    return;
  }
  window.open(url, "_blank");
}

function getSlugFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || "";
}

async function loadAppPage() {
  const slug = getSlugFromQuery();
  if (!slug) {
    container.innerHTML = "<div class='empty'>No app specified.</div>";
    return;
  }

  container.innerHTML = "<div class='loading'>Loading app…</div>";

  const url = `${API_BASE_PAGE}/api/apps`;
  console.log("🌐 Fetching apps for app page:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    const apps = data.apps || [];
    const app = apps.find(a => a.slug === slug);

    if (!app) {
      container.innerHTML = "<div class='empty'>App not found.</div>";
      return;
    }

    const card = document.createElement("article");
    card.className = "app-card";
    card.innerHTML = `
  <div class="app-header">
    <div>
      <div class="app-title">${app.title}</div>
      <div class="app-meta">${app.platform} • v${app.version}</div>
    </div>
  </div>

  <div class="app-description" style="max-height:none;">
    ${app.description}
  </div>

  <p><strong>Google Group (required):</strong><br>
    <a href="${app.groupLink}" target="_blank">Join Google Group</a>
  </p>

  <p><strong>Testing Link (unlocked after joining):</strong><br>
    <a href="${app.testLink}" target="_blank">${app.testLink}</a>
  </p>

  <div class="app-footer">
    <button class="btn btn-primary" onclick='joinTest("${app.groupLink}")'>
      Join test (Google Group)
    </button>
  </div>
`;
    container.innerHTML = "";
    container.appendChild(card);
  } catch (err) {
    console.log("❌ Error loading app page:", err);
    container.innerHTML = "<div class='empty'>Error loading app.</div>";
  }
}

window.joinTest = joinTest;

loadAppPage();
