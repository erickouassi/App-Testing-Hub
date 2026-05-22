import { parseStringPromise } from "xml2js";

const FEEDS_URL = "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/feeds.json";

async function getApprovedFeeds() {
  console.log("🔍 [update.js] Fetching approved feeds...");
  try {
    const res = await fetch(FEEDS_URL);
    const data = await res.json();
    console.log("✅ [update.js] Approved feeds loaded:", data.approvedFeeds?.length || 0);
    return data.approvedFeeds || [];
  } catch (err) {
    console.error("❌ [update.js] Critical Error loading feeds.json map:", err);
    return [];
  }
}

function countDaysSince(pubDate) {
  if (!pubDate) return 1;

  try {
    const published = new Date(pubDate);
    if (isNaN(published.getTime())) {
      console.warn("⚠️ Invalid pubDate:", pubDate);
      return 1;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    published.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - published.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysInTesting = Math.max(1, daysPassed + 1);

    console.log(`📅 [countDaysSince] ${pubDate} → Day ${daysInTesting}`);
    return daysInTesting;
  } catch (e) {
    return 1;
  }
}

export async function updateAllFeeds() {
  console.log("🚀 [update.js] Starting automated updateAllFeeds loop...");

  const feeds = await getApprovedFeeds();
  const apps = [];

  for (const url of feeds) {
    console.log(`\n🔄 Processing feed: ${url}`);
    
    try {
      const response = await fetch(url + "?t=" + Date.now());
      
      if (!response.ok) {
        console.warn(`⚠️ [SKIP] URL skipped. Server returned HTTP Status ${response.status} for: ${url}`);
        continue;
      }

      const xml = await response.text();
      
      if (!xml || !xml.trim()) {
        console.warn(`⚠️ [SKIP] URL skipped. Extracted string payload is empty for: ${url}`);
        continue;
      }

      const json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
        normalizeTags: true,
        tagNameProcessors: [(name) => name.replace(/^(app|dev|social):/, "").toLowerCase()],
        attrNameProcessors: [(name) => name.replace(/^(app|dev|social):/, "")]
      });

      const channel = json?.rss?.channel || json?.rss?.rss?.channel;
      if (!channel) {
        console.warn(`⚠️ [SKIP] URL skipped. Missing valid <channel> path structure inside RSS block for: ${url}`);
        continue;
      }

      let items = channel.item;
      if (!Array.isArray(items)) items = items ? [items] : [];

      if (items.length === 0) {
        console.warn(`⚠️ [SKIP] URL skipped. Clean parse loop structural document contain 0 active item configurations inside: ${url}`);
        continue;
      }

      console.log(`📡 [PARSER] Extracted ${items.length} items from feed channel. Checking entries...`);

      for (const item of items) {
        const title = (item.title || "Unknown App").toString().trim();

        const getField = (key) => {
          return item[key] || 
                 item[`app:${key}`] || 
                 item[key.toLowerCase()] || 
                 "";
        };

        const platform = getField("platform").toString().toLowerCase();
        if (platform && !platform.includes("android")) continue;

        let rawPubDate = item.pubdate || item["dc:date"] || item.pubDate;
        if (rawPubDate && typeof rawPubDate === 'object') {
          rawPubDate = rawPubDate._ || rawPubDate.text || Object.values(rawPubDate)[0];
        }

        const pubDate = rawPubDate ? rawPubDate.toString().trim() : new Date().toISOString();

        const testingDuration = parseInt(getField("testingDuration") || "14", 10);
        const daysInTesting = countDaysSince(pubDate);
        const daysLeft = Math.max(0, testingDuration - daysInTesting);

        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `app-${Date.now()}`;

        // Extracted attributes for the App Directory features safely
        const category = getField("category").toString().trim() || "General";
        const price = getField("price").toString().trim() || "Free";
        const icon = getField("icon").toString().trim() || "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/apple-touch-icon.png";
        const currentStatus = getField("status").toString().trim();

        const appData = {
          slug,
          title,
          description: (item.description?._ || item.description || "").toString().trim(),
          platform: "Android",
          version: getField("version") || "1.0.0",
          groupLink: getField("groupLink") || getField("grouplink"),
          testLink: getField("testLink") || getField("testlink"),
          pubDate,
          testingDuration,
          daysInTesting,
          daysLeft,
          status: currentStatus || (daysLeft > 0 ? "open-testing" : "testing-completed"),
          category,
          price,
          icon,
          languages: extractArray(item.languages || item["app:languages"]),
          countries: extractArray(item.countries || item["app:countries"]),
          requirements: extractArray(item.requirements || item["app:requirements"])
        };

        apps.push(appData);
      }
      
      console.log(`✅ Successfully structural elements appended into runtime object array memory layout from: ${url}`);

    } catch (err) {
      console.error(`❌ [AUTOMATION SKIP ERROR] Failed processing developer channel path [${url}]. Error context:`, err.message);
    }
  }

  console.log(`\n🏁 [update.js] Automation loop completed safely. Total apps verified globally: ${apps.length}`);
  return {
    generatedAt: new Date().toISOString(),
    apps: apps
  };
}

function extractArray(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") return field.split(",").map(s => s.trim()).filter(Boolean);

  for (const key of ['language', 'requirement', 'country']) {
    if (field[key]) {
      const val = field[key];
      return Array.isArray(val) ? val : [val].filter(Boolean);
    }
  }
  return [];
}

export function organizeHubApps(data) {
  if (!data || !Array.isArray(data.apps)) {
    console.warn("⚠️ No active apps array available to sort.");
    return [];
  }

  const openApps = data.apps.filter(app => app.status === "open-testing");
  const completedApps = data.apps.filter(app => app.status === "testing-completed");

  openApps.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  completedApps.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`📊 Sorted ${openApps.length} active apps and ${completedApps.length} completed apps.`);
  return [...openApps, ...completedApps];
}