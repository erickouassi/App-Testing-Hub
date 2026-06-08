// changelog.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Changelog DOM initialized");

  const timelineContainer = document.getElementById("changelogTimeline");
  const filterBar = document.getElementById("filterBar");

  if (!timelineContainer) return console.error("❌ Target element #changelogTimeline missing");

  try {
    console.log("🔍 Extracting configuration profile maps...");
    const feedsData = await fetch("https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/refs/heads/main/feeds.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP configurations inaccessible: ${r.status}`);
        return r.json();
      });

    // Parse feeds, compile complete records, and display
    const allUpdates = await compileGlobalChangelog(feedsData.approvedFeeds);
    renderChangelogTimeline(allUpdates, timelineContainer);
    setupFilterListeners(filterBar, timelineContainer);

  } catch (err) {
    console.error("❌ Initialization workflow execution broken:", err);
    timelineContainer.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Failed to initialize changelog array: ${err.message}</p>`;
  }
});

/* Reliable structural text extraction helper */
function getTagText(parentNode, tagName) {
  if (!parentNode) return "";
  const el = parentNode.getElementsByTagName(tagName)[0];
  return el ? el.textContent.trim() : "";
}

async function compileGlobalChangelog(feedUrls) {
  const masterUpdateList = [];

  for (const url of feedUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      let xmlText = await response.text();

      // Clean out XML namespace prefixes safely
      xmlText = xmlText.replace(/<\/?(dev|app|social|atom):/g, (match) => {
        return match.startsWith('</') ? '</' : '<';
      });

      const doc = new DOMParser().parseFromString(xmlText, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) continue;

      // Extract basic Channel details
      const channelNode = doc.getElementsByTagName("channel")[0];
      const rawChannelTitle = getTagText(channelNode, "title") || "Unknown App";
      const cleanAppName = rawChannelTitle.split("—")[0].trim();

      // Extract canonical Atom link reference
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

      // Process individual update nodes
      const items = doc.getElementsByTagName("item");
      for (let item of items) {
        const title = getTagText(item, "title") || "Track Deployment Update";
        const description = getTagText(item, "description");
        const pubDate = getTagText(item, "pubDate");
        const lastUpdated = getTagText(item, "lastUpdated");
        const icon = getTagText(item, "icon");
        const category = getTagText(item, "category") || "General";
        const version = getTagText(item, "version") || "1.0.0";
        const platform = getTagText(item, "platform") || "Android";
        const status = getTagText(item, "status") || "unknown";

        // Extract localized release notes safely
        const releaseNotesNode = item.getElementsByTagName("en-US")[0] || item.getElementsByTagName("releaseNotes")[0];
        const releaseNotes = releaseNotesNode ? releaseNotesNode.textContent.trim() : "";

        // Establish core baseline timeline timestamp parsing rules
        const rawDateString = lastUpdated || pubDate || "";
        const numericTimestamp = rawDateString ? Date.parse(rawDateString) : 0;

        masterUpdateList.push({
          appName: cleanAppName,
          feedUrl: canonicalFeedUrl,
          title,
          description,
          displayDate: rawDateString,
          timestamp: numericTimestamp,
          icon,
          category,
          version,
          platform,
          status
        });
      }

    } catch (e) {
      console.error(`❌ pipeline processing break on endpoint channel: ${url}`, e);
    }
  }

  // 🚨 REVERSE CHRONOLOGICAL SORT MATRIX (Ensures newest release notes stay safely on top)
  masterUpdateList.sort((x, y) => y.timestamp - x.timestamp);

  return masterUpdateList;
}

function renderChangelogTimeline(updates, container) {
  if (!container) return;
  container.innerHTML = "";

  if (!updates.length) {
    container.innerHTML = `<p style="text-align:center; color:#6b7280; padding:2rem;">No deployment matrix elements found across active channels.</p>`;
    return;
  }

  updates.forEach(entry => {
    const card = document.createElement("div");
    
    // Normalize status names into CSS safe class tags
    const normalizedStatusClass = entry.status.toLowerCase().replace(/\s+/g, "-");
    const safeDisplayStatus = entry.status.replace(/-/g, " ");

    card.className = "changelog-card";
    card.setAttribute("data-status", normalizedStatusClass);

    const imageMarkup = entry.icon 
      ? `<img src="${entry.icon}" class="app-icon" alt="" onerror="this.style.display='none'">`
      : `<div class="app-icon" style="background:#f3f4f6;"></div>`;

    const notesMarkup = entry.releaseNotes 
      ? `<div class="release-notes-block"><strong>Track Release Notes:</strong><pre>${entry.releaseNotes}</pre></div>`
      : "";

    const canonicalFeedRow = entry.feedUrl 
      ? `· <a href="${entry.feedUrl}" target="_blank" class="feed-link">Feed Source</a>`
      : "";

    card.innerHTML = `
      <div class="card-header">
        ${imageMarkup}
        <div class="header-details">
          <div class="title-row">
            <h3 class="app-title">${entry.appName} <span style="font-weight:400; font-size:0.95rem; color:#9ca3af;">v${entry.version}</span></h3>
            <span class="status-pill status-${normalizedStatusClass}">${safeDisplayStatus}</span>
          </div>
          <div class="meta-row">
            <span>${entry.platform}</span> · 
            <span>${entry.category}</span> · 
            <span style="font-weight:500; color:#4b5563;">${entry.displayDate}</span> 
            ${canonicalFeedRow}
          </div>
        </div>
      </div>
      <p class="update-summary"><strong>${entry.title}:</strong> ${entry.description}</p>
      ${notesMarkup}
    `;

    container.appendChild(card);
  });
}

function setupFilterListeners(bar, container) {
  if (!bar || !container) return;

  bar.addEventListener("click", (event) => {
    const targetButton = event.target.closest(".filter-btn");
    if (!targetButton) return;

    // Toggle selected state visual cues
    bar.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    targetButton.classList.add("active");

    const targetFilter = targetButton.getAttribute("data-filter");
    const cards = container.querySelectorAll(".changelog-card");

    cards.forEach(card => {
      const cardStatus = card.getAttribute("data-status");
      
      if (targetFilter === "all") {
        card.classList.remove("hidden");
      } else if (targetFilter === "open-testing" && (cardStatus === "open-testing" || cardStatus === "testing")) {
        card.classList.remove("hidden");
      } else if (targetFilter === "closed-testing" && cardStatus === "closed-testing") {
        card.classList.remove("hidden");
      } else if (targetFilter === "production" && (cardStatus === "production" || cardStatus === "stable")) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });
}