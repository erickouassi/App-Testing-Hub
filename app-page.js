console.log("🔥 app-page.js loaded");

const API_BASE_PAGE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const container = document.getElementById("app-page-container");

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
  loadAppPage();
}

function isFlagged(collection, slug) {
  return !!userState[collection][slug];
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
    loadAppPage();
  }
}

function getSlugFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || "";
}

function formatDaysLabel(app) {
  const { daysInTesting = 0, daysLeft = 0, testingDuration = 0 } = app;

  if (testingDuration > 0) {
    return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in • ${daysLeft} day${daysLeft === 1 ? "" : "s"} left (${testingDuration} total)`;
  }

  return `Testing: ${daysInTesting} day${daysInTesting === 1 ? "" : "s"} in`;
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

function groupMembersLabel(app) {
  if (!app.groupMembers || app.groupMembers <= 0) return "";
  return `👥 ${app.groupMembers} member${app.groupMembers === 1 ? "" : "s"}`;
}

async function loadAppPage() {
  const slug = getSlugFromQuery();
  if (!slug) {
    container.innerHTML = "<div class='empty'>No app specified.</div>";
    return;
  }

  container.innerHTML = "<div class='loading'>Loading app…</div>";

  const url = `${API_BASE_PAGE}/api/apps`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const apps = data.apps || [];
    const app = apps.find(a => a.slug === slug);

    if (!app) {
      container.innerHTML = "<div class='empty'>App not found.</div>";
      return;
    }

    const isFav = isFlagged("favorites", slug);
    const isSaved = isFlagged("saved", slug);
    const isLiked = isFlagged("likes", slug);
    const joined = isFlagged("joined", slug);
    const completed = isFlagged("completed", slug);

    const card = document.createElement("article");
    card.className = "app-card";
    card.innerHTML = `
      <div class="app-header">
        <div>
          <div class="app-title">${app.title}</div>
          <div class="app-meta">Android • v${app.version}</div>
          <div class="app-badges">
            <span class="badge badge-android">Android</span>
            ${joined ? '<span class="badge badge-status-joined">Joined</span>' : ""}
            ${completed ? '<span class="badge badge-status-completed">Completed</span>' : ""}
            ${isFav ? '<span class="badge">★ Favorite</span>' : ""}
            ${isSaved ? '<span class="badge">Saved</span>' : ""}
            ${isLiked ? '<span class="badge">Liked</span>' : ""}
          </div>
        </div>
      </div>

      <div class="app-description" style="max-height:none;">
        ${app.description}
      </div>

      <p><strong>Testing:</strong> ${formatDaysLabel(app)}</p>
      <p><strong>Status:</strong> ${app.status}</p>
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

      <div class="app-actions" style="margin-top:8px;">
        <button class="btn btn-ghost" onclick='toggleFlag("saved", "${slug}")'>
          ${isSaved ? "Unsave" : "Save"}
        </button>
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
        <button class="btn btn-primary" onclick='joinTest(${JSON.stringify(app)})'>
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
window.toggleFlag = toggleFlag;

loadAppPage();
