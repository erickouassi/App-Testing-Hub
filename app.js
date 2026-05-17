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
const activityFilters = document.getElementById("activity-filters");

let allApps = [];
let currentActivityFilter = "all";

const STORAGE_KEY = "testingHubState";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
      return {
        favorites: {},
        likes: {},
        joined: {},
        completed: {},
        saved: {}
      };
    return JSON.parse(raw);
  } catch {
    return {
      favorites: {},
      likes: {},
      joined: {},
      completed: {},
      saved: {}
    };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let userState = loadState();

function toggleFlag(collection, slug) {
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  renderApps();
}

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
}

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
}

function setEmpty(isEmpty) {
  emptyEl.classList.toggle("hidden", !isEmpty);
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
      const proceed = confirm(
        "After joining the Google Group, click OK to open the testing link."
      );
      if (proceed) window.open(testLink, "_blank");
    }, 1200);
  }

  if (app.slug) {
    userState.joined[app.slug] = true;
    saveState(userState);
    renderApps();
  }
}

function openAppPage(slug) {
  window.location.href = `/app.html?slug=${encodeURIComponent(slug)}`;
}

function formatDaysLabel(app) {
  const { daysInTesting = 0, daysLeft = 0, testingDuration = 0 } = app;

  if (testingDuration > 0) {
    return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in • ${daysLeft} day${daysLeft === 1 ? "" : "s"} left (${testingDuration} total)`;
  }

  return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in`;
}

function groupMembersLabel(app) {
  if (!app.groupMembers || app.groupMembers <= 0) return "";
  return `👥 ${app.groupMembers} member${app.groupMembers === 1 ? "" : "s"}`;
}

function statusBadge(app) {
  const status = app.status || "active-testing";
  const slug = app.slug || "";

  const joined = isFlagged("joined", slug);
  const completed = isFlagged("completed", slug);

  if (completed)
    return `<span class="badge badge-status-completed">Completed</span>`;
  if (joined)
    return `<span class="badge badge-status-joined">Joined</span>`;

  switch (status) {
    case "testing-completed":
      return `<span class="badge badge-status-completed">Testing completed</span>`;
    case "expired":
      return `<span class="badge badge-status-expired">Expired</span>`;
    case "not-started":
      return `<span class="badge badge-status-not-started">Not started</span>`;
    case "closed":
      return `<span class="badge badge-status-closed">Closed</span>`;
    default:
      return `<span class="badge badge-status-active">Open for testers</span>`;
  }
}

function progressBar(app) {
  const { daysInTesting = 0, testingDuration = 0 } = app;
  if (!testingDuration || testingDuration <= 0) return "";

  const pct = Math.max(
    5,
    Math.min(100, Math.round((daysInTesting / testingDuration) * 100))
  );

  return `
    <div class="progress">
      <div class="progress-bar" style="width:${pct}%"></div>
    </div>
  `;
}

function showDetails(app) {
  const modal = document.getElementById("details-modal");
  const body = document.getElementById("modal-body");

  const slug = app.slug || "";
  const isFav = isFlagged("favorites", slug);
  const isSaved = isFlagged("saved", slug);
  const isLiked = isFlagged("likes", slug);
  const joined = isFlagged("joined", slug);
  const completed = isFlagged("completed", slug);

  body.innerHTML = `
    <h2>${app.title}</h2>
    <p>${app.description}</p>

    <p><strong>Platform:</strong> Android</p>
    <p><strong>Version:</strong> ${app.version}</p>
    <p><strong>Testing:</strong> ${formatDaysLabel(app)}</p>
    <p><strong>Status:</strong> ${app.status || "Active testing"}</p>
    <p><strong>Group Members:</strong> ${app.groupMembers || 0}</p>

    <p><strong>Google Group:</strong><br>
      ${
        app.groupLink
          ? `<a href="${app.groupLink}" target="_blank">Join Google Group</a>`
          : "Not provided"
      }
    </p>

    <p><strong>Testing Link:</strong><br>
      ${
        app.testLink
          ? `<a href="${app.testLink}" target="_blank">${app.testLink}</a>`
          : "Not provided"
      }
    </p>

    ${progressBar(app)}

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick='toggleFlag("saved", "${slug}")'>
        ${isSaved ? "Unsave" : "Save"}
      </button>
      <button class="btn btn-ghost" onclick='toggleFlag("favorites", "${slug}")'>
        ${isFav ? "Unfavorite" : "Favorite"}
      </button>
      <button class="btn btn-ghost" onclick='toggleFlag("likes", "${slug}")'>
        ${isLiked ? "Unlike" : "Like"}
      </button>
      <button class="btn btn-ghost" onclick='toggleFlag("joined", "${slug}")'>
        ${joined ? "Unmark joined" : "Mark joined"}
      </button>
      <button class="btn btn-ghost" onclick='toggleFlag("completed", "${slug}")'>
        ${completed ? "Unmark completed" : "Mark completed"}
      </button>
    </div>

    <button class="btn btn-primary" onclick='joinTest(${JSON.stringify(app)})'>
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
window.toggleFlag = toggleFlag;

function renderApps() {
  appsContainer.innerHTML = "";

  if (!allApps || allApps.length === 0) {
    setEmpty(true);
    emptyEl.textContent = "No apps found.";
    return;
  }

  let filtered = allApps.filter(app => {
    const slug = app.slug;

    switch (currentActivityFilter) {
      case "saved":
        return isFlagged("saved", slug);
      case "favorites":
        return isFlagged("favorites", slug);
      case "likes":
        return isFlagged("likes", slug);
      case "joined":
        return isFlagged("joined", slug);
      case "completed":
        return isFlagged("completed", slug);
      default:
        return true;
    }
  });

  appsCountLabel.textContent = `(${filtered.length} app${filtered.length === 1 ? "" : "s"})`;

  if (filtered.length === 0) {
    setEmpty(true);
    emptyEl.textContent = "No apps match your filters.";
    return;
  }

  setEmpty(false);

  filtered.forEach(app => {
    const card = document.createElement("article");
    card.className = "app-card";

    const slug = app.slug || "";
    const isFav = isFlagged("favorites", slug);
    const isSaved = isFlagged("saved", slug);
    const isLiked = isFlagged("likes", slug);

    card.innerHTML = `
      <div class="app-header">
        <div>
          <div class="app-title">${app.title}</div>
          <div class="app-meta">Android • v${app.version}</div>
          <div class="app-badges">
            <span class="badge badge-android">Android</span>
            ${statusBadge(app)}
            ${isFav ? '<span class="badge">★ Favorite</span>' : ""}
            ${isSaved ? '<span class="badge">Saved</span>' : ""}
            ${isLiked ? '<span class="badge">Liked</span>' : ""}
          </div>
        </div>
      </div>

      <div class="app-description">${app.description}</div>

      <div class="app-footer">
        <div class="app-timing">
          ${formatDaysLabel(app)}<br>
          ${groupMembersLabel(app)}
        </div>

        <div class="app-actions">
          <button class="btn btn-ghost" onclick='showDetails(${JSON.stringify(app)})'>
            Details
          </button>
          <button class="btn btn-primary" onclick='joinTest(${JSON.stringify(app)})'>
            Join test
          </button>
        </div>
      </div>

      ${progressBar(app)}
    `;

    appsContainer.appendChild(card);
  });
}

async function loadApps() {
  console.log("🔥 Loading apps");

  // Detect local vs production
  const API_URL =
    location.hostname === "127.0.0.1" || location.hostname === "localhost"
      ? "https://app-testing-hub.vercel.app/api/apps"
      : "/api/apps";

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    console.log("DEBUG API response:", data);

    // ✅ FIX: Extract the array correctly
    const allApps = Array.isArray(data.apps) ? data.apps : [];

    if (!allApps.length) {
      console.warn("⚠️ No apps found in response.");
    }

    renderApps(allApps);
  } catch (err) {
    console.error("❌ Error loading apps:", err);
  }
}


async function refreshApps() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing…";

  const url = `${API_BASE}/api/build`;

  try {
    await fetch(url);
  } catch {}

  await loadApps();

  refreshBtn.disabled = false;
  refreshBtn.textContent = "🔄 Refresh apps";
}

activityFilters.addEventListener("click", e => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;

  currentActivityFilter = btn.getAttribute("data-filter");

  [...activityFilters.querySelectorAll(".filter-chip")].forEach(chip =>
    chip.classList.toggle("active", chip === btn)
  );

  renderApps();
});

refreshBtn.addEventListener("click", refreshApps);

loadApps();
