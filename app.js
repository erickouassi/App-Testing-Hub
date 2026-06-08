console.log("🔥 app.js — Stable synced version with debugging logs");

const STORAGE_KEY = "testingHubState";
const appsContainer = document.getElementById("apps-container");
const filterContainer = document.getElementById("filter-container");

let allApps = [];
let currentFilter = "all";

function isAndroidDevice() {
  return /android/i.test(navigator.userAgent || navigator.vendor || window.opera);
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return { joined: p.joined||{}, completed: p.completed||{}, saved: p.saved||{} };
  } catch { return { joined: {}, completed: {}, saved: {} }; }
}

function saveState(s) { 
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){} 
}

let userState = loadState();

window.toggleCardFlag = function(collection, slug) {
  if (!userState[collection]) userState[collection] = {};
  userState[collection][slug] = !userState[collection][slug];
  saveState(userState);
  renderApps();
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

function getStatusBadgeMarkup(app, slug) {
  if (isProductionStatus(app.status) || isFlagged("completed", slug)) {
    return `<span style="background:#d1fae5;color:#166534;padding:4px 12px;border-radius:9999px;font-size:0.8rem;font-weight:600;">Completed</span>`;
  }
  if (isFlagged("joined", slug)) {
    return `<span style="background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:9999px;font-size:0.8rem;font-weight:600;">Joined Track</span>`;
  }
  return `<span style="background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:9999px;font-size:0.8rem;font-weight:600;">Open Testing</span>`;
}

window.joinCardTestFlow = function(escaped) {
  try {
    const app = JSON.parse(decodeURIComponent(escaped));
    const groupLink = app.groupLink?.trim();
    const testLink = app.testLink?.trim();
    const devEmail = app.developerEmail || app.email?.trim();

    if (groupLink && groupLink.includes("groups.google.com")) {
      window.open(groupLink, "_blank");
      if (testLink) setTimeout(() => confirm("After joining group, open test track?") && window.open(testLink, "_blank"), 1200);
    } else if (devEmail || groupLink) {
      const target = devEmail || groupLink;
      const subj = encodeURIComponent(`[App Testing Hub] Request Invite: ${app.title}`);
      const body = encodeURIComponent(`Hello,\n\nI would love to participate in testing for ${app.title}.`);
      window.open(`mailto:${target}?subject=${subj}&body=${body}`, "_self");
      if (testLink) setTimeout(() => confirm("Request sent. Open test track?") && window.open(testLink, "_blank"), 1200);
    } else if (testLink) window.open(testLink, "_blank");

    if (app.slug) {
      userState.joined[app.slug] = true;
      saveState(userState);
      renderApps();
    }
  } catch(e) { console.error(e); }
};

function renderApps() {
  if (!appsContainer) return;

  console.log(`📊 Current Filter: "${currentFilter}" | Total Apps Loaded: ${allApps.length}`);

  const filtered = allApps.filter(app => {
    if (!app?.slug) return false;
    if (currentFilter === "all") return true;
    if (currentFilter === "joined") return isFlagged("joined", app.slug);
    if (currentFilter === "completed") return isProductionStatus(app.status) || isFlagged("completed", app.slug);
    if (currentFilter === "saved") return isFlagged("saved", app.slug);
    return true;
  });

  console.log(`✅ Filtered Apps (${filtered.length}):`, filtered.map(a => ({ 
    title: a.title, 
    slug: a.slug, 
    status: a.status,
    isCompleted: isProductionStatus(a.status) || isFlagged("completed", a.slug)
  })));

  appsContainer.innerHTML = filtered.map(app => {
    const slug = app.slug;
    const escaped = encodeURIComponent(JSON.stringify(app));
    const isProd = isProductionStatus(app.status);
    const durationLabel = app.testingDuration ? `Day ${app.daysInTesting || 1} of ${app.testingDuration}` : `Day ${app.daysInTesting || 1} in testing`;

    let actionBtn = '';
    if (isProd) {
      const target = app.storeLink || app.testLink || app.fallbackUrl || "#";
      actionBtn = `<button onclick="window.open('${target}','_blank')" style="padding:8px 20px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;">Open App / Play Store</button>`;
    } else {
      actionBtn = `<button onclick="joinCardTestFlow('${escaped}')" style="padding:8px 20px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;">Join test</button>`;
    }

    return `
      <div class="app-card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;">
        <div style="display:flex;gap:12px;align-items:start;margin-bottom:12px;">
          <img src="${app.icon || 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png'}" alt="${app.title}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;">
          <div style="flex:1;">
            <h4 style="margin:0 0 4px 0;">${app.title}</h4>
            <div style="font-size:0.78rem;color:var(--muted);">v${app.version||'1.0'} • ${app.category||'General'}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          ${getStatusBadgeMarkup(app, slug)}
          ${isFlagged("saved", slug) ? `<span style="background:#e6c200;color:#111;padding:2px 8px;border-radius:10px;">★ Favorite</span>` : ''}
        </div>

        <p style="margin-bottom:16px;">${app.description || ''}</p>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:12px;">
          <span style="color:var(--muted);">${durationLabel}</span>
          <div style="display:flex;gap:8px;">
            <a href="app.html?slug=${slug}" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;text-decoration:none;">Details</a>
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadApps() {
  try {
    console.log("🔍 Fetching feeds.json...");
    const feedsRes = await fetch("https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/refs/heads/main/feeds.json");
    const feeds = await feedsRes.json();
    console.log("📋 Approved feeds count:", feeds.approvedFeeds?.length || 0);

    const map = new Map();

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

        const items = Array.from(doc.querySelectorAll("item"));
        if (!items.length) continue;

        items.sort((a,b) => (Date.parse(getTagText(b,"lastUpdated")||getTagText(b,"pubDate")||"0") - Date.parse(getTagText(a,"lastUpdated")||getTagText(a,"pubDate")||"0")));

        const latest = items[0];
        const status = getTagText(latest, "status") || "unknown";
        if (["hidden","draft","archived"].includes(status.toLowerCase())) continue;

        const appData = {
          slug, title,
          icon: getTagText(latest,"icon"),
          category: getTagText(latest,"category") || "General",
          version: getTagText(latest,"version") || "1.0",
          status,
          description: getTagText(latest,"description"),
          testingDuration: getTagText(latest,"testingDuration") || "14",
          daysInTesting: getTagText(latest,"daysInTesting") || "1",
          feedUrl: url,
          developerEmail: getTagText(doc.querySelector("developer"),"email"),
          groupLink: getTagText(latest,"groupLink") || getTagText(ch,"groupLink"),
          testLink: getTagText(latest,"testLink"),
          storeLink: getTagText(latest,"storeLink")
        };

        if (map.has(slug)) {
          const ex = map.get(slug);
          const newTs = Date.parse(getTagText(latest,"lastUpdated")||getTagText(latest,"pubDate")||"0");
          if (newTs > (Date.parse(ex._rawDateStr)||0)) map.set(slug, appData);
        } else {
          appData._rawDateStr = getTagText(latest,"lastUpdated")||getTagText(latest,"pubDate")||"";
          map.set(slug, appData);
        }
      } catch(e) {}
    }

    allApps = Array.from(map.values());
    console.log(`🎯 Final Apps Loaded: ${allApps.length}`, allApps.map(a => ({title: a.title, status: a.status})));
    renderApps();
  } catch(e) {
    console.error("❌ Load error:", e);
  }
}

function setupFilters() {
  if (!filterContainer) return;
  filterContainer.addEventListener("click", e => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    filterContainer.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter || "all";
    console.log(`🔄 Filter changed to: ${currentFilter}`);
    renderApps();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  setupFilters();
  loadApps();
});