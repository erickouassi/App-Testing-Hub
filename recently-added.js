// recently-added.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Recently Added DOM initialized");

  const gridContainer = document.getElementById("recentlyAddedGrid");
  if (!gridContainer) return console.error("❌ Target element #recentlyAddedGrid missing");

  try {
    console.log("🔍 Extracting configuration profiles...");
    const feedsData = await fetch("https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/refs/heads/main/feeds.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP configurations inaccessible: ${r.status}`);
        return r.json();
      });

    await processAndRenderRecentApps(feedsData.approvedFeeds, gridContainer);

  } catch (err) {
    console.error("❌ Initialization workflow exception broken:", err);
    gridContainer.innerHTML = `<p style="color:red; text-align:center; padding:2rem; grid-column: 1/-1;">Initialization Error: ${err.message}</p>`;
  }
});

/* Reliable structural text extraction helper */
function getTagText(parentNode, tagName) {
  if (!parentNode) return "";
  const el = parentNode.getElementsByTagName(tagName)[0];
  return el ? el.textContent.trim() : "";
}

async function processAndRenderRecentApps(feedUrls, container) {
  const channelRegistryList = [];

  for (const url of feedUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      let xmlText = await response.text();

      // Clean out XML namespace prefixes safely so DOMParser reads them consistently
      xmlText = xmlText.replace(/<\/?(dev|app|social|atom):/g, (match) => {
        return match.startsWith('</') ? '</' : '<';
      });

      const doc = new DOMParser().parseFromString(xmlText, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) continue;

      const channelNode = doc.getElementsByTagName("channel")[0];
      const rawChannelTitle = getTagText(channelNode, "title") || "Unknown App";
      const cleanAppName = rawChannelTitle.split("—")[0].trim();

      // Extract developer contact backup email for direct invite requests from dev:developer node
      const devEmail = getTagText(doc.getElementsByTagName("developer")[0], "email");

      // Extract canonical Feed track URL link
      let canonicalFeedUrl = "";
      const linkElements = channelNode.getElementsByTagName("link");
      for (let el of linkElements) {
        if (el.getAttribute("rel") === "self" || el.getAttribute("type") === "application/rss+xml") {
          canonicalFeedUrl = el.getAttribute("href") || "";
          break;
        }
      }
      if (!canonicalFeedUrl && linkElements.length) {
        for (let el of linkElements) {
          if (el.hasAttribute("href")) {
            canonicalFeedUrl = el.getAttribute("href");
            break;
          }
        }
      }

      // Collect all update item entries to pinpoint chronological edges
      const itemsArray = Array.from(doc.getElementsByTagName("item"));
      if (!itemsArray.length) continue;

      // CHRONOLOGICAL DATE SORT: Sorts descending (Index 0 will always be the LATEST release item)
      itemsArray.sort((a, b) => {
        const strA = getTagText(a, "lastUpdated") || getTagText(a, "pubDate") || "";
        const strB = getTagText(b, "lastUpdated") || getTagText(b, "pubDate") || "";
        return (strB ? Date.parse(strB) : 0) - (strA ? Date.parse(strA) : 0);
      });

      // Pinpoint items representing historical bounds
      const latestItem = itemsArray[0];
      const oldestItem = itemsArray[itemsArray.length - 1];

      // Extract details strictly out of the freshest chronological deployment entry
      const description = getTagText(latestItem, "description") || "No summary profile offered.";
      const icon = getTagText(latestItem, "icon");
      const platform = getTagText(latestItem, "platform") || "Android";
      const category = getTagText(latestItem, "category") || "General";
      const status = getTagText(latestItem, "status") || "unknown";
      const version = getTagText(latestItem, "version") || "1.0.0";
      
      // Extract testing communication gateways & action links from latest release entry
      const testLink = getTagText(latestItem, "testLink");
      const groupLink = getTagText(latestItem, "groupLink");
      const storeLink = getTagText(latestItem, "storeLink") || getTagText(latestItem, "playStoreUrl");
      const fallbackUrl = getTagText(latestItem, "link") || getTagText(latestItem, "url");

      // Original creation index calculation point (derived from the oldest historical update)
      const initialDateString = getTagText(oldestItem, "lastUpdated") || getTagText(oldestItem, "pubDate") || "";
      const latestDateString = getTagText(latestItem, "lastUpdated") || getTagText(latestItem, "pubDate") || "";
      const sortingTimestamp = latestDateString ? Date.parse(latestDateString) : 0;

      channelRegistryList.push({
        name: cleanAppName,
        icon: icon,
        platform: platform,
        category: category,
        description: description,
        feedUrl: canonicalFeedUrl,
        version: version,
        status: status,
        testLink: testLink,
        groupLink: groupLink,
        storeLink: storeLink,
        fallbackUrl: fallbackUrl,
        developerEmail: devEmail,
        registeredDateString: initialDateString, 
        latestUpdateTimestamp: sortingTimestamp  
      });

    } catch (e) {
      console.error(`❌ Parse pipeline interrupt error on feed endpoint: ${url}`, e);
    }
  }

  // SORT MATRIX: Order the page so apps that pushed updates most recently sit at the top
  channelRegistryList.sort((x, y) => y.latestUpdateTimestamp - x.latestUpdateTimestamp);

  // Render Layout
  container.innerHTML = "";

  if (!channelRegistryList.length) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#6b7280; padding:2rem;">No registered application entries found across active tracking logs.</p>`;
    return;
  }

  channelRegistryList.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";

    const imageMarkup = app.icon 
      ? `<img src="${app.icon}" class="app-icon" alt="" onerror="this.style.display='none'">`
      : `<div class="app-icon" style="background:#e5e7eb;"></div>`;

    const normalizedStatusClass = app.status.toLowerCase().replace(/\s+/g, "-");
    const safeDisplayStatus = app.status.replace(/-/g, " ");

    // 🚨 CONTEXTUAL ACTION TRAY MATRIX WITH ENHANCED ONBOARDING RULES
    let actionTrayHTML = "";

    if (normalizedStatusClass === "closed-testing" || normalizedStatusClass === "open-testing" || normalizedStatusClass === "testing") {
      
      // Step 1: Establish Community Gateway Registration Priority Button (Groups vs Email Invite)
      if (app.groupLink && app.groupLink.includes("groups.google.com")) {
        actionTrayHTML += `<a href="${app.groupLink}" target="_blank" class="action-btn btn-primary">👥 1. Join Testing Group</a>`;
      } else if (app.developerEmail || app.groupLink) {
        const targetEmail = app.developerEmail || app.groupLink;
        const trackName = normalizedStatusClass.replace("-", " ");
        const mailSubject = encodeURIComponent(`[App Testing Hub] Request Invite: ${app.name}`);
        const mailBody = encodeURIComponent(`Hello,\n\nI would love to participate in the ${trackName} track for ${app.name} (v${app.version}). Please register my Google account to your list of testers.\n\nThank you!`);
        
        actionTrayHTML += `<a href="mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}" class="action-btn btn-primary">📩 1. Request Email Invite</a>`;
      }

      // Step 2: Establish the Functional Testing Link Target Integration Link Button
      const linkTarget = app.testLink || app.fallbackUrl;
      if (linkTarget) {
        // If an onboarding gateway was rendered above, this acts as step 2; otherwise it is a single primary action
        const buttonClass = actionTrayHTML ? "btn-secondary" : "btn-primary";
        const prefixLabel = actionTrayHTML ? "🧪 2. " : "🚀 ";
        actionTrayHTML += `<a href="${linkTarget}" target="_blank" class="action-btn ${buttonClass}">${prefixLabel}Access Test Track</a>`;
      }

    } else if (normalizedStatusClass === "production" || normalizedStatusClass === "stable") {
      const prodTarget = app.storeLink || app.fallbackUrl;
      if (prodTarget) {
        actionTrayHTML += `<a href="${prodTarget}" target="_blank" class="action-btn btn-primary">🛍️ Download on Play Store</a>`;
      }
    } else {
      const fallbackTarget = app.fallbackUrl || app.testLink || app.storeLink;
      if (fallbackTarget) {
        actionTrayHTML += `<a href="${fallbackTarget}" target="_blank" class="action-btn btn-secondary">🌐 View Project Resource</a>`;
      }
    }

    if (!actionTrayHTML) {
      actionTrayHTML = `<span style="font-size:0.8rem; color:#9ca3af; text-align:center; font-style:italic;">No active links configured for this track.</span>`;
    }

    const feedRowMarkup = app.feedUrl 
      ? `<span><strong>Track:</strong> <a href="${app.feedUrl}" target="_blank" class="feed-link">${app.feedUrl}</a></span>`
      : `<span><strong>Track:</strong> Reference Feed Link N/A</span>`;

    card.innerHTML = `
      <div>
        <div class="card-top">
          ${imageMarkup}
          <div class="header-info">
            <div class="title-badge-row">
              <h2 class="app-title">${app.name} <span style="font-weight:400; font-size:0.85rem; color:#9ca3af;">v${app.version}</span></h2>
              <span class="status-pill status-${normalizedStatusClass}">${safeDisplayStatus}</span>
            </div>
            <span class="platform-tag"><strong>${app.platform}</strong> · ${app.category}</span>
          </div>
        </div>
        <div class="card-body">
          ${app.description}
        </div>
      </div>

      <div>
        <div class="action-tray">
          ${actionTrayHTML}
        </div>
        <div class="card-footer">
          <span><strong>Ecosystem Entry:</strong> ${app.registeredDateString}</span>
          ${feedRowMarkup}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}