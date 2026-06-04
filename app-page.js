console.log("🚀 app-page.js: Universal Specification Component Engine Active");

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
    return raw ? JSON.parse(raw) : { favorites: {}, joined: {}, completed: {}, saved: {} };
  } catch {
    return { favorites: {}, joined: {}, completed: {}, saved: {} };
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

// 1. Precise Detailed Screen Primary Action Switcher Matrix
function getDetailPageActionButtonMarkup(app, slug, escapedAppJson) {
  const isAndroid = isAndroidDevice();
  const testLink = app.testLink?.trim() || "#";
  const days = parseInt(app.daysInTesting || 1);
  const duration = parseInt(app.testingDuration || 0);

  // STATE A: VERIFIED COMPLETIONS OR OVERFLOW CONSTRAINTS
  if (isFlagged("completed", slug) || app.status === "testing-completed" || (duration > 0 && days > duration)) {
    if (isAndroid) {
      return `
        <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color: #fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
          Launch URL Link
        </button>
      `;
    } else {
      return `
        <button class="btn" style="padding: 10px 24px; font-weight: 600; background: #e5e7eb; color: #9ca3af; border-radius:6px; cursor: not-allowed; border: 1px solid #d1d5db;" disabled>
          Completed
        </button>
      `;
    }
  }

  // STATE B: DYNAMIC GOOGLE PRE-REGISTRATION PROGRAMS
  if (app.status === "pre-registration") {
    return `
      <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
        Launch URL Link
      </button>
    `;
  }

  // STATE C: COMMITTED RETURNING TRACKS (JOINED)
  if (isFlagged("joined", slug)) {
    if (isAndroid) {
      return `
        <button class="btn" style="padding: 10px 24px; font-weight: 600; background: transparent; border: 2px solid #2563eb; color: #2563eb; border-radius:6px; cursor: pointer;" onclick="universalProgramJoinFlow('${escapedAppJson}')">
          Relaunch Track Links
        </button>
      `;
    } else {
      return `
        <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
          Launch URL Link
        </button>
      `;
    }
  }

  // STATE D: ORIGINAL BASE TRACK ACCESS DISCOVERY
  if (isAndroid) {
    return `
      <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="universalProgramJoinFlow('${escapedAppJson}')">
        Join Program Track
      </button>
    `;
  } else {
    return `
      <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
        Launch URL Link
      </button>
    `;
  }
}

// 2. Full XML Payload Destructuring & Document Assembly
async function loadAppPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug || !container) return;

  try {
    const res = await fetch(`${API_BASE_PAGE}/api/apps?t=${Date.now()}`);
    const data = await res.json();
    const appsList = data.apps || data;

    const app = appsList.find((a) => a && a.slug === slug);
    if (!app) return;

    const escapedAppJson = encodeURIComponent(JSON.stringify(app));

    // Handle dynamic requirements array parsing safely out from XML namespaces
    const reqArray = Array.isArray(app.requirements) ? app.requirements : typeof app.requirements === "string" ? app.requirements.split(",") : ["Android Phone Hardware Compatibility", "Google Play Account Authentication Authorization", "Continuous Track Installation"];
    const geoArray = Array.isArray(app.countries) ? app.countries : typeof app.countries === "string" ? app.countries.split(",") : ["Global Track Release"];

    const requirementsMarkup = reqArray.map(r => `<li style="margin-bottom:6px; color:#4b5563;">🔒 <strong>${r.trim()}</strong></li>`).join("");
    
    // Geo-Fence Trap Alert Guard scenario
    const geoAlertBlock = geoArray.includes("All") || geoArray.includes("Global Track Release") 
      ? `<div style="color:#059669; font-size:0.85rem; font-weight:500;">🌍 Open to all global region store profiles safely.</div>`
      : `<div style="color:#dc2626; font-size:0.85rem; font-weight:500;">⚠️ Regional Constraint Alert: This track is geo-fenced to [${geoArray.join(", ")}]. Check store layout match before joining.</div>`;

    container.innerHTML = `
      <article style="font-family: system-ui, sans-serif; max-width: 750px; margin: 20px auto; background:#fff; padding:24px; border-radius:12px; border:1px solid #e5e7eb;">
        <div style="display: flex; gap: 16px; align-items: start; margin-bottom: 20px;">
          <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" alt="${app.title}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 1px solid #e5e7eb;">
          <div style="flex: 1;">
            <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin:0 0 4px 0;">${app.title}</h3>
            <div style="font-size: 0.85rem; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Program Type: ${app.programType || 'Closed Testing Track'}</div>
          </div>
        </div>

        <p style="margin: 20px 0; color: #374151; line-height: 1.5; font-size:0.95rem;">${app.description || ''}</p>

        <!-- Dynamic XML Specifications Context Box Block -->
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

        <!-- Sync Control Actions Utility Deck -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid #e5e7eb; align-items:center;">
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='toggleFlag("saved", "${slug}")'>
            ${isFlagged("saved", slug) ? "★ Unsave" : "☆ Save Track"}
          </button>
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='toggleFlag("joined", "${slug}")'>
            ${isFlagged("joined", slug) ? "Unmark Joined" : "Mark Joined State"}
          </button>
          <button class="btn" style="padding: 8px 14px; font-size:0.82rem; border-radius:6px; background:#fff; border:1px solid #d1d5db; color:#374151; cursor:pointer;" onclick='toggleFlag("completed", "${slug}")'>
            ${isFlagged("completed", slug) ? "Undo Complete" : "Mark Completed"}
          </button>
          <span style="flex-grow: 1;"></span>
          ${getDetailPageActionButtonMarkup(app, slug, escapedAppJson)}
        </div>
      </article>
    `;
  } catch (err) {
    console.error("Page Architecture Render Exception:", err);
  }
}

// 3. Fallback Cross-Execution Setup Bridge
window.universalProgramJoinFlow = window.universalProgramJoinFlow || function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    if (!app.groupLink || app.programType === "open-beta") {
      window.open(app.testLink, "_blank");
    } else {
      window.open(app.groupLink, "_blank");
      setTimeout(() => {
        if(confirm("Advance pipeline to target testing slot confirmation link?")) {
          window.open(app.testLink, "_blank");
        }
      }, 1000);
    }
    userState.joined[app.slug] = true;
    saveState(userState);
    loadAppPage();
  } catch(e){ console.error(e); }
};

document.addEventListener("DOMContentLoaded", loadAppPage);