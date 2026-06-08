console.log("🚀 app-page.js: Universal Specification Component Engine Active with Feed Sync — Fully Synced");

const API_BASE_PAGE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "https://app-testing-hub.vercel.app"
    : "";

const container = document.getElementById("app-page-container");
const STORAGE_KEY = "testingHubState";

function isAndroidDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      favorites: parsed.favorites || {},
      joined: parsed.joined || {},
      completed: parsed.completed || {},
      saved: parsed.saved || {}
    };
  } catch (err) {
    return { favorites: {}, joined: {}, completed: {}, saved: {} };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("❌ Failed to commit state:", err);
  }
}

let userState = loadState();

window.toggleFlag = function (collection, slug) {
  if (!userState[collection]) userState[collection] = {};
  userState[collection][slug] = !userState[collection][slug];

  if (collection === "saved") {
    if (!userState.favorites) userState.favorites = {};
    userState.favorites[slug] = userState.saved[slug];
  } else if (collection === "favorites") {
    if (!userState.saved) userState.saved = {};
    userState.saved[slug] = userState.favorites[slug];
  }

  saveState(userState);
  loadAppPage();
};

function isFlagged(collection, slug) {
  return !!(userState[collection] && userState[collection][slug]);
}

function isProductionStatus(status) {
  if (!status) return false;
  const norm = status.toLowerCase().trim();
  return ["production", "stable", "production-live", "testing-completed", "completed"].includes(norm);
}

function getDetailPageActionButtonMarkup(app, slug, escapedAppJson) {
  const isAndroid = isAndroidDevice();
  const testLink = app.testLink?.trim() || "#";

  if (isFlagged("completed", slug) || isProductionStatus(app.status)) {
    const target = app.storeLink || app.fallbackUrl || testLink;
    if (isAndroid) {
      return `<button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color: #fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${target}', '_blank')">Open App / Play Store</button>`;
    } else {
      return `<button class="btn" style="padding: 10px 24px; font-weight: 600; background: #e5e7eb; color: #9ca3af; border-radius:6px; cursor: not-allowed; border: 1px solid #d1d5db;" disabled>Completed</button>`;
    }
  }

  if ((app.status || "").toLowerCase().trim() === "pre-registration") {
    return `<button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">Pre-Register Here</button>`;
  }

  if (isAndroid) {
    const label = isFlagged("joined", slug) ? "Relaunch Track Links" : "Join Program Track";
    return `<button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.universalProgramJoinFlow('${escapedAppJson}')">${label}</button>`;
  } else {
    return `<button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">Launch URL Link</button>`;
  }
}

function statusBadge(app, slug) {
  if (isFlagged("completed", slug) || isProductionStatus(app.status)) {
    return `<span class="badge badge-status-completed" style="background-color: #d1fae5; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">✓ Completed</span>`;
  }
  if (isFlagged("joined", slug)) {
    return `<span class="badge badge-status-joined" style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">Joined Track</span>`;
  }

  const normalizedStatus = (app.status || "").toLowerCase().trim();
  if (normalizedStatus === "pre-registration") {
    return `<span class="badge badge-status-preregister" style="background-color: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">🗓️ Pre-Register</span>`;
  }

  let trackLabel = "Testing Track";
  if (app.programType === "internal") trackLabel = "Internal Track";
  else if (["open-beta", "open-testing", "testing"].includes(normalizedStatus)) trackLabel = "Open Beta";
  else if (["closed", "closed-testing"].includes(normalizedStatus)) trackLabel = "Closed Track";

  return `<span class="badge badge-status-active" style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">🟢 ${trackLabel}</span>`;
}

async function loadAppPage() {
  const params = new URLSearchParams(window.location.search);
  const rawSlug = params.get("slug");
  if (!rawSlug || !container) return;

  try {
    const res = await fetch(`${API_BASE_PAGE}/api/apps?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    
    const data = await res.json();
    let appsList = Array.isArray(data) ? data : (data.apps || data.apps?.apps || []);

    const app = appsList.find((a) => a?.slug && (rawSlug === a.slug || rawSlug.startsWith(a.slug) || a.slug.startsWith(rawSlug)));

    if (!app) {
      container.innerHTML = `<div class="empty" style="color: #6b7280; text-align: center; padding: 40px;">Application specification profile not found.</div>`;
      return;
    }

    const slug = app.slug;
    const escapedAppJson = encodeURIComponent(JSON.stringify(app));
    const dynamicFeedUrl = app.feedUrl || `${API_BASE_PAGE}/api/feed.xml?slug=${slug}`;

    const reqArray = Array.isArray(app.requirements) ? app.requirements : typeof app.requirements === "string" ? app.requirements.split(",") : ["Android Phone", "Google Play Account", "Keep Installed"];
    const geoArray = Array.isArray(app.countries) ? app.countries : typeof app.countries === "string" ? app.countries.split(",") : ["Global"];

    const requirementsMarkup = reqArray.map(r => `<li style="margin-bottom:6px; color:#4b5563;">🔒 <strong>${r.trim()}</strong></li>`).join("");
    
    const geoAlertBlock = geoArray.includes("All") || geoArray.includes("Global") 
      ? `<div style="color:#059669; font-size:0.85rem; font-weight:500;">🌍 Open to all global region store profiles safely.</div>`
      : `<div style="color:#dc2626; font-size:0.85rem; font-weight:500;">⚠️ Regional Constraint Alert: This track is geo-fenced to [${geoArray.join(", ")}].</div>`;

    container.innerHTML = `
      <article style="font-family: system-ui, sans-serif; max-width: 750px; margin: 20px auto; background:#fff; padding:24px; border-radius:12px; border:1px solid #e5e7eb;">
        <div style="display: flex; gap: 16px; align-items: start; margin-bottom: 20px;">
          <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" alt="${app.title}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 1px solid #e5e7eb;">
          <div style="flex: 1;">
            <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin:0 0 4px 0;">${app.title}</h3>
            <div style="font-size: 0.85rem; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
              Category: ${app.category || 'General'} • Price: ${app.price || 'Free'}
            </div>
          </div>
        </div>

        <div class="app-badges" style="margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          ${statusBadge(app, slug)}
          ${isFlagged("saved", slug) ? '<span class="badge" style="background: #fef08a; color: #854d0e; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">★ Favorited</span>' : ""}
          <a href="${dynamicFeedUrl}" target="_blank" class="filter-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.75rem; border-radius: 12px; text-decoration: none; font-weight: 500; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;">
            📡 Follow App Feed XML
          </a>
        </div>

        <p style="margin: 20px 0; color: #374151; line-height: 1.5; font-size:0.95rem;">${app.description || ''}</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h5 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #111827; font-weight:600; text-transform:uppercase;">Track Configuration Context</h5>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:0.85rem; margin-bottom:12px;">
            <div><span style="color:#6b7280;">App Version:</span> <strong>${app.version || '1.0.0'}</strong></div>
            <div><span style="color:#6b7280;">Price Profile:</span> <strong>${app.price || 'Free'}</strong></div>
            <div><span style="color:#6b7280;">Days Run:</span> <strong>${app.daysInTesting || 1} Days Active</strong></div>
            <div><span style="color:#6b7280;">Track Limit:</span> <strong>${app.testingDuration || 14} Days Total</strong></div>
          </div>
          <div style="padding-top:12px; border-top:1px solid #e5e7eb; font-size:0.85rem;">
            <div style="font-weight:600; color:#374151; margin-bottom:6px;">Technical Requirements Checklist:</div>
            <ul style="padding-left:0; list-style:none; margin:0 0 12px 0;">${requirementsMarkup}</ul>
            ${geoAlertBlock}
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid #e5e7eb; align-items:center;">
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='window.toggleFlag("saved", "${slug}")'>
            ${isFlagged("saved", slug) ? "★ Unsave" : "☆ Save Track"}
          </button>
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='window.toggleFlag("joined", "${slug}")'>
            ${isFlagged("joined", slug) ? "Unmark Joined" : "Mark Joined State"}
          </button>
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='window.toggleFlag("completed", "${slug}")'>
            ${isFlagged("completed", slug) ? "Undo Complete" : "Mark Completed"}
          </button>
          <span style="flex-grow: 1;"></span>
          ${getDetailPageActionButtonMarkup(app, slug, escapedAppJson)}
        </div>
      </article>
    `;
  } catch (err) {
    console.error(err);
    if (container) container.innerHTML = `<div class="empty" style="color: #dc2626; text-align: center; padding: 20px;">Failed to load app details.</div>`;
  }
}

window.universalProgramJoinFlow = function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();
    const devEmail = app.developerEmail || app.email?.trim();

    if (groupLink && groupLink.includes("groups.google.com")) {
      window.open(groupLink, "_blank");
      if (testLink) setTimeout(() => confirm("Group joined. Open test track?") && window.open(testLink, "_blank"), 1200);
    } else if (devEmail || groupLink) {
      const target = devEmail || groupLink;
      const subj = encodeURIComponent(`[App Testing Hub] Request Invite: ${app.title}`);
      const body = encodeURIComponent(`Hello,\n\nI would love to participate in testing for ${app.title}.`);
      window.open(`mailto:${target}?subject=${subj}&body=${body}`, "_self");
      if (testLink) setTimeout(() => confirm("Request sent. Open test track?") && window.open(testLink, "_blank"), 1200);
    } else if (testLink) {
      window.open(testLink, "_blank");
    }

    if (app.slug) {
      userState.joined[app.slug] = true;
      saveState(userState);
      loadAppPage();
    }
  } catch(e) {
    console.error(e);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAppPage);
} else {
  loadAppPage();
}