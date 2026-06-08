// developers.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM fully loaded — initializing developer directory");

  const container = document.getElementById("developerCatalog");
  const panel = document.getElementById("detailPanel");
  const panelBody = document.getElementById("panelBody");
  const closePanel = document.getElementById("closePanel");

  if (!container) console.error("❌ Missing #developerCatalog element");
  if (!panel) console.error("❌ Missing #detailPanel element");
  if (!panelBody) console.error("❌ Missing #panelBody element");
  if (!closePanel) console.error("❌ Missing #closePanel element");

  closePanel?.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  panel?.addEventListener("click", (e) => {
    if (e.target === panel) {
      panel.classList.add("hidden");
    }
  });

  try {
    console.log("🔍 Fetching feeds.json from GitHub...");
    const feeds = await fetch("https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/refs/heads/main/feeds.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP status error: ${r.status}`);
        return r.json();
      });

    const profiles = await buildDeveloperDirectory(feeds.approvedFeeds);
    renderDevelopers(profiles, container, panel, panelBody);
    console.log("✅ Render complete");
  } catch (err) {
    console.error("❌ Error loading feeds or rendering:", err);
    if (container) {
      container.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Initialization Error: ${err.message}</p>`;
    }
  }
});

/* Reliable structural text extraction helper */
function getTagText(parentNode, tagName) {
  if (!parentNode) return "";
  const el = parentNode.getElementsByTagName(tagName)[0];
  return el ? el.textContent.trim() : "";
}

async function buildDeveloperDirectory(feedUrls) {
  const profiles = {};

  for (const url of feedUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      let xmlText = await response.text();
      
      // Clean out XML namespace prefixes so standard DOM methods fetch nodes flawlessly
      xmlText = xmlText.replace(/<\/?(dev|app|social|atom):/g, (match) => {
        return match.startsWith('</') ? '</' : '<';
      });

      const doc = new DOMParser().parseFromString(xmlText, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) continue;

      // Extract Developer Parent Info
      const devNode = doc.getElementsByTagName("developer")[0] || doc.getElementsByTagName("channel")[0];
      if (!devNode) continue;

      const email = getTagText(devNode, "email");
      if (!email) continue;

      if (!profiles[email]) {
        const socialNode = doc.getElementsByTagName("links")[0] || devNode;
        const devTypeRaw = getTagText(devNode, "developerType");
        const developerTypes = devTypeRaw
          ? devTypeRaw.split(",").map(t => t.trim()).filter(Boolean)
          : [];

        profiles[email] = {
          name: getTagText(devNode, "name") || "Anonymous Developer",
          email: email,
          website: getTagText(devNode, "website"),
          avatar: getTagText(devNode, "avatar"),
          tagline: getTagText(devNode, "tagline"),
          bio: getTagText(devNode, "bio"),
          location: getTagText(devNode, "location"),
          teamSize: getTagText(devNode, "teamSize"),
          portfolio: getTagText(devNode, "portfolio"),
          developerTypes: developerTypes,
          socials: {
            reddit: getTagText(socialNode, "reddit"),
            github: getTagText(socialNode, "github"),
            twitter: getTagText(socialNode, "twitter"),
            youtube: getTagText(socialNode, "youtube"),
            instagram: getTagText(socialNode, "instagram"),
            linkedin: getTagText(socialNode, "linkedin"),
            discord: getTagText(socialNode, "discord")
          },
          apps: {} 
        };
      }

      // Group versions inside unique app objects named by the Channel Title
      const channelNode = doc.getElementsByTagName("channel")[0];
      const rawChannelTitle = getTagText(channelNode, "title") || "Unknown App";
      const cleanAppName = rawChannelTitle.split("—")[0].trim(); 

      // 🚨 EXTRACT FEED TRACK URL LINK: Finds <link rel="self" type="application/rss+xml">
      let canonicalFeedUrl = "";
      const linkElements = channelNode.getElementsByTagName("link");
      for (let el of linkElements) {
        if (el.getAttribute("rel") === "self" || el.getAttribute("type") === "application/rss+xml") {
          canonicalFeedUrl = el.getAttribute("href") || "";
          break;
        }
      }
      // Fallback if no specific attributes match, but element has href attribute
      if (!canonicalFeedUrl && linkElements.length) {
        for (let el of linkElements) {
          if (el.hasAttribute("href")) {
            canonicalFeedUrl = el.getAttribute("href");
            break;
          }
        }
      }

      // Gather item elements into a mutable array
      const itemsArray = Array.from(doc.getElementsByTagName("item"));
      
      // CHRONOLOGICAL DATE SORT: Uses lastUpdated, falls back to pubDate, computes Unix timestamps to sort descending
      itemsArray.sort((a, b) => {
        const strA = getTagText(a, "lastUpdated") || getTagText(a, "pubDate") || "";
        const strB = getTagText(b, "lastUpdated") || getTagText(b, "pubDate") || "";
        
        const timeA = strA ? Date.parse(strA) : 0;
        const timeB = strB ? Date.parse(strB) : 0;
        
        return timeB - timeA; // Newest timestamp floating to index 0
      });
      
      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];
        
        const itemTitle = getTagText(item, "title") || "Update Entry";
        const description = getTagText(item, "description");
        const pubDate = getTagText(item, "pubDate");
        const lastUpdated = getTagText(item, "lastUpdated");
        const icon = getTagText(item, "icon");
        const category = getTagText(item, "category");
        const version = getTagText(item, "version");
        const platform = getTagText(item, "platform");
        const status = getTagText(item, "status");
        
        // Grab localized release note strings safely
        const releaseNotesNode = item.getElementsByTagName("en-US")[0] || item.getElementsByTagName("releaseNotes")[0];
        const releaseNotes = releaseNotesNode ? releaseNotesNode.textContent.trim() : "";

        // Use lastUpdated for layout timeline display if available, fallback to pubDate
        const displayDate = lastUpdated || pubDate;

        const versionPayload = {
          itemTitle,
          version: version || "1.0.0",
          status: status || "unknown",
          description,
          releaseNotes,
          pubDate: displayDate
        };

        // Initialize parent app fields explicitly from the newly validated freshest chronological entry (index 0)
        if (!profiles[email].apps[cleanAppName]) {
          profiles[email].apps[cleanAppName] = {
            title: cleanAppName,
            icon: icon,
            category: category || "General",
            platform: platform || "Android",
            feedUrl: canonicalFeedUrl, // 🚨 Saved down to the distinct application payload entry
            currentVersion: version || "1.0.0", 
            currentStatus: status || "unknown",   
            currentDescription: description,
            history: []
          };
        }

        // Push versions into timeline collection sequence
        profiles[email].apps[cleanAppName].history.push(versionPayload);
      }

    } catch (err) {
      console.error("❌ Processing parsing pipeline exception:", url, err);
    }
  }
  return profiles;
}

function renderDevelopers(profiles, container, panel, panelBody) {
  if (!container) return;
  container.innerHTML = "";
  const devs = Object.values(profiles);
  
  if (!devs.length) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#6b7280;">No active verified developers found.</p>`;
    return;
  }

  devs.forEach(dev => {
    const card = document.createElement("div");
    card.className = "dev-card";

    const avatarHTML = dev.avatar
      ? `<img src="${dev.avatar}" class="dev-avatar" alt="${dev.name}" onerror="this.style.display='none'">`
      : `<div class="dev-avatar" style="background:#e5e7eb;"></div>`;

    const typesHTML = (dev.developerTypes || [])
      .map(t => `<span class="badge">${t}</span>`)
      .join("");

    card.innerHTML = `
      <div class="dev-header">
        ${avatarHTML}
        <div>
          <h3 class="dev-name">${dev.name}</h3>
          <p class="dev-tagline">${dev.tagline || ""}</p>
          <div class="dev-types" style="margin-top:4px;">${typesHTML}</div>
        </div>
      </div>
      <p class="dev-bio" style="margin-top:10px;">${dev.bio || "No profile bio shared yet."}</p>
    `;

    card.addEventListener("click", () => {
      const socialsHTML = Object.entries(dev.socials || {})
        .filter(([_, url]) => url)
        .map(([name, url]) => `<a href="${url}" target="_blank" class="social-link">${name}</a>`)
        .join("");

      const appList = Object.values(dev.apps || {});
      const appsHTML = appList.map(app => {
        
        // Build chronological version item tracks
        const timelineHTML = app.history.map((release, index) => {
          const cleanStatus = release.status.replace(/-/g, " ");
          const statusClass = release.status.toLowerCase().replace(/\s+/g, "-");
          
          const structuralNotes = release.releaseNotes 
            ? `<div class="history-notes"><strong>Release Notes:</strong><pre>${release.releaseNotes}</pre></div>`
            : "";

          return `
            <div class="history-item ${index === 0 ? 'latest-release' : ''}">
              <div class="history-meta-header">
                <span class="history-version">v${release.version} ${index === 0 ? '<small class="latest-tag">(Current)</small>' : ''}</span>
                <span class="badge status-pill status-${statusClass}">${cleanStatus}</span>
              </div>
              <p class="history-date">${release.pubDate}</p>
              <p class="history-summary">${release.description}</p>
              ${structuralNotes}
            </div>
          `;
        }).join("");

        const currentCleanStatus = app.currentStatus.replace(/-/g, " ");
        const currentStatusClass = app.currentStatus.toLowerCase().replace(/\s+/g, "-");

        // 🚨 Renders the dynamic Feed Link row cleanly below metadata parameters
        const appFeedHTML = app.feedUrl 
          ? `<p class="app-feed-link" style="margin: 4px 0 0 0; font-size:0.78rem; color:#2563eb; word-break: break-all;"><strong>Feed Track:</strong> <a href="${app.feedUrl}" target="_blank" style="color:inherit; text-decoration:underline;">${app.feedUrl}</a></p>`
          : "";

        return `
          <div class="grouped-app-container" style="display:flex; flex-direction: column; align-items: stretch; gap: 0.5rem; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              ${app.icon ? `<div class="app-icon"><img src="${app.icon}" alt="${app.title}" style="width:48px; height:48px; border-radius:10px; object-fit:cover;" onerror="this.parentNode.removeChild(this)"></div>` : ""}
              <div class="app-info" style="flex:1;">
                <div class="app-title-row" style="display:flex; justify-content:space-between; align-items:center; gap: 0.5rem;">
                  <h4 class="app-title" style="margin:0; font-size:1rem; font-weight:600;">${app.title}</h4>
                  <span class="badge status-pill status-${currentStatusClass}">${currentCleanStatus}</span>
                </div>
                <p class="app-meta" style="margin: 4px 0 0 0; font-size:0.8rem; color:#858e9c;">${app.platform} · ${app.category} · Live Build: v${app.currentVersion}</p>
                ${appFeedHTML}
              </div>
            </div>
            
            <div class="version-history-timeline" style="margin-top:1rem; padding-top:0.75rem; border-top:1px dashed #e5e7eb;">
              <h5 class="timeline-title" style="margin:0 0 0.5rem 0; font-size:0.82rem; text-transform:uppercase; color:#6b7280; letter-spacing:0.05em;">Track Version Logs & Deployments</h5>
              <div class="timeline-wrapper" style="display:flex; flex-direction:column; gap:0.75rem;">
                ${timelineHTML}
              </div>
            </div>
          </div>
        `;
      }).join("");

      panelBody.innerHTML = `
        <div class="panel-header-block">
          ${dev.avatar ? `<img src="${dev.avatar}" class="panel-avatar" alt="">` : ""}
          <h2>${dev.name}</h2>
          <p class="panel-tagline"><em>${dev.tagline || ""}</em></p>
        </div>
        <hr class="panel-divider" />
        
        <div class="panel-grid-meta">
          <p><strong>Email:</strong> <a href="mailto:${dev.email}">${dev.email}</a></p>
          ${dev.website ? `<p><strong>Website:</strong> <a href="${dev.website}" target="_blank">${dev.website}</a></p>` : ""}
          ${dev.portfolio ? `<p><strong>Portfolio:</strong> <a href="${dev.portfolio}" target="_blank">${dev.portfolio}</a></p>` : ""}
          ${dev.location ? `<p><strong>Location:</strong> ${dev.location}</p>` : ""}
          ${dev.teamSize ? `<p><strong>Team Size:</strong> ${dev.teamSize}</p>` : ""}
        </div>

        <h3>Bio</h3>
        <p class="panel-bio-text">${dev.bio || "No custom biography provided."}</p>

        <h3>Social Connections</h3>
        <div class="panel-social-box">${socialsHTML || "<span style='color:#9ca3af;'>No platforms listed.</span>"}</div>

        <h3>Applications Managed (${appList.length})</h3>
        <div class="app-list">${appsHTML || "<p style='color:#9ca3af;'>No apps cataloged yet.</p>"}</div>
      `;

      panel.classList.remove("hidden");
    });

    container.appendChild(card);
  });
}

// Global Styles Injection Sheet Layer
const style = document.createElement('style');
style.innerHTML = `
body { font-family: system-ui, -apple-system, sans-serif; background: #fafafa; color: #111827; margin: 0; }
header { text-align: center; padding: 2.5rem 1rem 1rem; }
.catalog { max-width: 1100px; margin: 2rem auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; padding: 0 1rem; }
.dev-card { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.04); cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; }
.dev-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }
.dev-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
.dev-avatar { width: 56px; height: 56px; border-radius: 50%; background: #e5e7eb; object-fit: cover; flex-shrink: 0; }
.dev-name { margin: 0; font-size: 1.1rem; font-weight: 600; }
.dev-tagline { margin: 2px 0 0 0; font-size: 0.85rem; color: #6b7280; }
.badge { background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; margin-right: 4px; display: inline-block; }
.dev-bio { margin: 0.75rem 0 0 0; font-size: 0.9rem; color: #4b5563; line-height: 1.4; }

/* Detail Panel Overlays */
.panel { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.panel.hidden { display: none; }
.panel-content { background: #fff; border-radius: 16px; width: 100%; max-width: 650px; max-height: 85vh; padding: 2rem; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
#panelBody { overflow-y: auto; padding-right: 0.5rem; }
.close-btn { position: absolute; top: 1rem; right: 1.25rem; background: #f3f4f6; border: none; font-size: 1.25rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #4b5563; }
.close-btn:hover { background: #e5e7eb; }
.panel-header-block { text-align: center; margin-top: 0.5rem; }
.panel-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 0.5rem; display: block; }
.panel-divider { border: 0; border-top: 1px solid #f3f4f6; margin: 1.5rem 0; }
.panel-grid-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem; font-size: 0.9rem; background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
.panel-grid-meta p { margin: 0; color: #4b5563; line-height: 1.5; }
.panel-grid-meta a { color: #2563eb; text-decoration: none; word-break: break-all; }
.panel-social-box { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.social-link { background: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; text-decoration: none; text-transform: capitalize; font-weight: 500; }
.social-link:hover { background: #dbeafe; }

/* Status Badges */
.status-pill { text-transform: capitalize; font-weight: 600; font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; margin-right: 0; white-space: nowrap; }
.status-open-testing, .status-testing { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.status-closed-testing { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
.status-production, .status-stable { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-testing-completed { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

.history-item { background: #ffffff; border: 1px solid #e5e7eb; border-left: 3px solid #9ca3af; padding: 0.75rem; border-radius: 8px; position: relative; }
.history-item.latest-release { border-left-color: #2563eb; background: #f8fafc; }
.history-meta-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.history-version { font-weight: 600; font-size: 0.9rem; color: #1f2937; }
.latest-tag { color: #2563eb; font-weight: 500; margin-left: 0.25rem; }
.history-date { margin: 3px 0 0 0; font-size: 0.75rem; color: #9ca3af; }
.history-summary { margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #4b5563; line-height: 1.45; }
.history-notes { margin-top: 0.5rem; font-size: 0.8rem; background: #f3f4f6; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px solid #e5e7eb; }
.history-notes pre { margin: 4px 0 0 0; white-space: pre-wrap; font-family: inherit; color: #374151; line-height: 1.4; }
footer { text-align: center; padding: 2rem; color: #9ca3af; }
`;
document.head.appendChild(style);