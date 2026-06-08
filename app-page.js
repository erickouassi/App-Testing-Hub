console.log("🚀 app-page.js: Universal Specification Component Engine Active with Synchronized Feed Architecture");

const STORAGE_KEY = "testingHubState";
const container = document.getElementById("app-page-container");

function isAndroidDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
}

function initThemeEngine() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  toggleBtn.onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };
}

// State engine strictly mirroring app.js schema
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return { joined: p.joined || {}, completed: p.completed || {}, saved: p.saved || {} };
  } catch { 
    return { joined: {}, completed: {}, saved: {} }; 
  }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
}

let userState = loadState();

window.toggleFlag = function (collection, slug) {
  if (!userState[collection]) userState[collection] = {};
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  loadAppPage(); // Re-render local page profile elements immediately
};

function isFlagged(c, slug) {
  return !!(userState[c] && userState[c][slug]);
}

function isProductionStatus(status) {
  if (!status) return false;
  const norm = status.toLowerCase().trim();
  return ["production", "stable", "production-live", "testing-completed", "completed"].includes(norm);
}

function getTagText(p, t) {
  if (!p) return "";
  const el = p.getElementsByTagName(t)[0];
  return el ? el.textContent.trim() : "";
}

function getDetailPageActionButtonMarkup(app, slug, escapedAppJson) {
  const isAndroid = isAndroidDevice();
  const testLink = app.testLink?.trim() || "#";
  const isProd = isProductionStatus(app.status) || isFlagged("completed", slug);

  if (isProd) {
    const prodTarget = app.storeLink || app.fallbackUrl || testLink;
    if (isAndroid) {
      return `
        <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color: #fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${prodTarget}', '_blank')">
          Open App / Play Store
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

  if ((app.status || "").toLowerCase().trim() === "pre-registration") {
    return `
      <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.open('${testLink}', '_blank')">
        Pre-Register Here
      </button>
    `;
  }

  if (isAndroid) {
    const label = isFlagged("joined", slug) ? "Relaunch Track Links" : "Join Program Track";
    return `
      <button class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: #2563eb; color:#fff; border:none; border-radius:6px; cursor: pointer;" onclick="window.universalProgramJoinFlow('${escapedAppJson}')">
        ${label}
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
  if (app.programType === "internal" || normalizedStatus === "internal") trackLabel = "Internal Track";
  else if (app.programType === "open-beta" || normalizedStatus === "open-testing" || normalizedStatus === "testing" || normalizedStatus === "open beta") trackLabel = "Open Beta";
  else if (app.programType === "closed" || normalizedStatus === "closed-testing" || normalizedStatus === "closed track") trackLabel = "Closed Track";

  return `<span class="badge badge-status-active" style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">🟢 ${trackLabel}</span>`;
}

async function loadAppPage() {
  const params = new URLSearchParams(window.location.search);
  const rawSlug = params.get("slug");
  if (!rawSlug || !container) return;

  try {
    // Exact structural fetch mechanism imported from stable app.js core
    const feedsRes = await fetch("https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/refs/heads/main/feeds.json");
    const feeds = await feedsRes.json();
    
    let targetApp = null;

    for (const url of feeds.approvedFeeds || []) {
      try {
        const r = await fetch(url);
        let xml = await r.text();
        xml = xml.replace(/<\/?(dev|app|social|atom):/g, m => m.startsWith('</') ? '</' : '<');
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        if (doc.querySelector("parsererror")) continue;

        const ch = doc.querySelector("channel");
        if (!ch) continue;

        const rawTitle = getTagText(ch, "title");
        const title = rawTitle.split("—")[0].trim();
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

        // Target check optimization match
        if (slug !== rawSlug) continue;

        const items = Array.from(doc.querySelectorAll("item"));
        if (!items.length) continue;

        items.sort((a,b) => (Date.parse(getTagText(b,"lastUpdated")||getTagText(b,"pubDate")||"0") - Date.parse(getTagText(a,"lastUpdated")||getTagText(a,"pubDate")||"0")));

        const latest = items[0];
        
        targetApp = {
          slug, title,
          icon: getTagText(latest,"icon"),
          category: getTagText(latest,"category") || "General",
          version: getTagText(latest,"version") || "1.0",
          status: getTagText(latest, "status") || "unknown",
          description: getTagText(latest,"description"),
          testingDuration: getTagText(latest,"testingDuration") || "14",
          daysInTesting: getTagText(latest,"daysInTesting") || "1",
          feedUrl: url,
          developerEmail: getTagText(doc.querySelector("developer"),"email"),
          groupLink: getTagText(latest,"groupLink") || getTagText(ch,"groupLink"),
          testLink: getTagText(latest,"testLink"),
          storeLink: getTagText(latest,"storeLink"),
          // Map safely parsed items fallback handles
          price: getTagText(latest, "price") || "Free",
          requirements: getTagText(latest, "requirements") || "",
          countries: getTagText(latest, "countries") || "Global Track Release"
        };
        break; 
      } catch(e) {}
    }

    if (!targetApp) {
      container.innerHTML = `<div class="empty" style="color: #6b7280; text-align: center; padding: 40px;">Application specification profile not found.</div>`;
      return;
    }

    const slug = targetApp.slug;
    const escapedAppJson = encodeURIComponent(JSON.stringify(targetApp));

    const reqArray = targetApp.requirements ? targetApp.requirements.split(",") : ["Android Phone Hardware Compatibility", "Google Play Account Authentication Authorization", "Continuous Track Installation"];
    const geoArray = targetApp.countries ? targetApp.countries.split(",") : ["Global Track Release"];

    const requirementsMarkup = reqArray.map(r => `<li style="margin-bottom:6px; color:#4b5563;">🔒 <strong>${r.trim()}</strong></li>`).join("");
    
    const geoAlertBlock = geoArray.map(g => g.trim().toLowerCase()).includes("all") || geoArray.map(g => g.trim().toLowerCase()).includes("global track release")
      ? `<div style="color:#059669; font-size:0.85rem; font-weight:500;">🌍 Open to all global region store profiles safely.</div>`
      : `<div style="color:#dc2626; font-size:0.85rem; font-weight:500;">⚠️ Regional Constraint Alert: This track is geo-fenced to [${geoArray.join(", ")}]. Check store layout match before joining.</div>`;

    container.innerHTML = `
      <article style="font-family: system-ui, sans-serif; max-width: 750px; margin: 20px auto; background:#fff; padding:24px; border-radius:12px; border:1px solid #e5e7eb;">
        
        <div style="display: flex; gap: 16px; align-items: start; margin-bottom: 20px;">
          <img src="${targetApp.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" alt="${targetApp.title}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 1px solid #e5e7eb;">
          <div style="flex: 1;">
            <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin:0 0 4px 0;">${targetApp.title}</h3>
            <div style="font-size: 0.85rem; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
              Category: ${targetApp.category} • Price: ${targetApp.price}
            </div>
          </div>
        </div>

        <div class="app-badges" style="margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          ${statusBadge(targetApp, slug)}
          ${isFlagged("saved", slug) ? '<span class="badge" style="background: #fef08a; color: #854d0e; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">★ Favorited</span>' : ""}
          
          <a href="${targetApp.feedUrl}" target="_blank" class="filter-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.75rem; border-radius: 12px; text-decoration: none; font-weight: 500; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;">
            📡 Follow App Feed XML
          </a>
        </div>

        <p style="margin: 20px 0; color: #374151; line-height: 1.5; font-size:0.95rem;">${targetApp.description || 'No description available.'}</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h5 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #111827; font-weight:600; text-transform:uppercase;">Track Configuration Context</h5>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:0.85rem; margin-bottom:12px;">
            <div><span style="color:#6b7280;">App Version:</span> <strong>${targetApp.version}</strong></div>
            <div><span style="color:#6b7280;">Price Profile:</span> <strong>${targetApp.price}</strong></div>
            <div><span style="color:#6b7280;">Days Run:</span> <strong>${targetApp.daysInTesting} Days Active</strong></div>
            <div><span style="color:#6b7280;">Track Limit:</span> <strong>${targetApp.testingDuration} Days Total</strong></div>
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
          ${getDetailPageActionButtonMarkup(targetApp, slug, escapedAppJson)}
        </div>
      </article>
    `;
  } catch (err) {
    console.error("❌ Critical layout setup trace caught failure:", err);
    if (container) {
      container.innerHTML = `<div class="empty" style="color: #dc2626; text-align: center; padding: 20px;">Failed to safely compile dashboard profiles.</div>`;
    }
  }
}

window.universalProgramJoinFlow = window.universalProgramJoinFlow || function(appJsonEscaped) {
  try {
    const app = JSON.parse(decodeURIComponent(appJsonEscaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();
    const devEmail = app.developerEmail || app.email?.trim();

    if (groupLink && groupLink.includes("groups.google.com")) {
      window.open(groupLink, "_blank");
      if (testLink) {
        setTimeout(() => {
          if (confirm("Google Group community page loaded. Click OK to advance to the official Google Play Testing Opt-in portal link.")) {
            window.open(testLink, "_blank");
          }
        }, 1100);
      }
    } else if (devEmail || groupLink) {
      const targetEmail = devEmail || groupLink;
      const mailSubject = encodeURIComponent(`[App Testing Hub] Request Invite: ${app.title || "App"}`);
      const mailBody = encodeURIComponent(`Hello,\n\nI would love to participate in the testing track for ${app.title || "your application"}. Please register my Google account to your list of testers.\n\nThank you!`);
      
      window.open(`mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}`, "_self");
      
      if (testLink) {
        setTimeout(() => {
          if (confirm("Onboarding invite request sent. Click OK to advance to the official Google Play Testing portal link.")) {
            window.open(testLink, "_blank");
          }
        }, 1100);
      }
    } else {
      if (testLink) window.open(testLink, "_blank");
    }
    
    if (app.slug) {
      if (!userState.joined) userState.joined = {};
      userState.joined[app.slug] = true;
      saveState(userState);
      loadAppPage();
    }
  } catch(e) { 
    console.error("Workflow Engine Exception:", e); 
  }
};

// Initialization hook
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initThemeEngine();
    loadAppPage();
  });
} else {
  initThemeEngine();
  loadAppPage();
}