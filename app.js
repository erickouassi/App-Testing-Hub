console.log("🔥 app.js loaded");

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const appsContainer = document.getElementById("apps-container");
const loadingEl = document.getElementById("apps-loading");
const emptyEl = document.getElementById("apps-empty");
const lastUpdatedEl = document.getElementById("last-updated");
const appsCountLabel = document.getElementById("apps-count-label");
const refreshBtn = document.getElementById("refresh-btn");
const platformFilters = document.getElementById("platform-filters");

let allApps = [];
let currentPlatform = "all";

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
}

function setEmpty(isEmpty) {
  emptyEl.classList.toggle("hidden", !isEmpty);
}

function joinTest(url) {
  if (!url) {
    alert("This app requires joining the Google Group first. No group link found.");
    return;
  }
  window.open(url, "_blank");
}


function openAppPage(slug) {
  window.location.href = `/app.html?slug=${encodeURIComponent(slug)}`;
}

function showDetails(app) {
  const modal = document.getElementById("details-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = `
    <h2>${app.title}</h2>
    <p>${app.description}</p>

    <p><strong>Platform:</strong> ${app.platform}</p>
    <p><strong>Version:</strong> ${app.version}</p>

    <p><strong>Google Group (required):</strong><br>
      <a href="${app.groupLink}" target="_blank">Join Google Group</a>
    </p>

    <p><strong>Testing Link (unlocked after joining):</strong><br>
      <a href="${app.testLink}" target="_blank">${app.testLink}</a>
    </p>

    <button class="btn btn-primary" onclick="joinTest('${app.groupLink}')">
  Join test (Google Group)
</button>

  `;

  modal.classList.remove("hidden");
}


function closeModal() {
  document.getElementById("details-modal").classList.add("hidden");
}

window.closeModal = closeModal;
window.joinTest = joinTest;
window.showDetails = showDetails;
window.openAppPage = openAppPage;

function renderApps() {
  appsContainer.innerHTML = "";

  const filtered = allApps.filter(app => {
    if (currentPlatform === "all") return true;
    return (app.platform || "").toLowerCase() === currentPlatform.toLowerCase();
  });

  appsCountLabel.textContent = `(${filtered.length} app${filtered.length === 1 ? "" : "s"})`;

  if (filtered.length === 0) {
    setEmpty(true);
    return;
  }

  setEmpty(false);

  filtered.forEach(app => {
    const card = document.createElement("article");
    card.className = "app-card";

    const title = app.title || "Untitled app";
    const platform = app.platform || "Unknown platform";
    const version = app.version || "—";
    const description = app.description || "";
    const slug = app.slug || "";

    card.innerHTML = `
      <div class="app-header">
        <div>
          <div class="app-title">${title}</div>
          <div class="app-meta">${platform} • v${version}</div>
          <div class="app-badges">
            <span class="badge badge-status-active">Open for testers</span>
          </div>
        </div>
      </div>
      <div class="app-description">${description}</div>
      <div class="app-footer">
        <div class="app-timing">
          14‑day install requirement • Daily usage recommended
        </div>
        <div class="app-actions">
          <button class="btn btn-ghost" onclick='openAppPage("${slug}")'>Details</button>
          <button class="btn btn-primary" onclick='joinTest("${app.group || ""}")'>
            Join test
          </button>
        </div>
      </div>
    `;

    appsContainer.appendChild(card);
  });
}

async function loadApps() {
  setLoading(true);
  setEmpty(false);
  appsContainer.innerHTML = "";

  const url = `${API_BASE}/api/apps`;
  console.log("🌐 Fetching apps:", url);

  try {
    const res = await fetch(url);
    console.log("📥 /api/apps status:", res.status);
    const data = await res.json();

    allApps = data.apps || [];

    if (data.generatedAt) {
      const d = new Date(data.generatedAt);
      lastUpdatedEl.textContent = `Last updated: ${d.toLocaleString()}`;
    }

    setLoading(false);
    renderApps();
  } catch (err) {
    console.log("❌ Error loading apps:", err);
    setLoading(false);
    setEmpty(true);
  }
}

async function refreshApps() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing…";

  const url = `${API_BASE}/api/build`;
  console.log("🌐 Triggering build:", url);

  try {
    const res = await fetch(url);
    console.log("📥 /api/build status:", res.status);
    await res.json().catch(() => null);
  } catch (err) {
    console.log("❌ Error triggering build:", err);
  }

  await loadApps();

  refreshBtn.disabled = false;
  refreshBtn.textContent = "🔄 Refresh apps";
}

platformFilters.addEventListener("click", e => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;

  currentPlatform = btn.getAttribute("data-platform");

  [...platformFilters.querySelectorAll(".filter-chip")].forEach(chip =>
    chip.classList.toggle("active", chip === btn)
  );

  renderApps();
});

refreshBtn.addEventListener("click", refreshApps);

loadApps();
