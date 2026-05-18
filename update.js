import { parseStringPromise } from "xml2js";

const FEEDS_URL = "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/feeds.json";

async function getApprovedFeeds() {
  console.log("🔍 [update.js] Fetching approved feeds...");
  try {
    const res = await fetch(FEEDS_URL);
    const data = await res.json();
    console.log("✅ [update.js] Approved feeds:", data.approvedFeeds?.length || 0);
    return data.approvedFeeds || [];
  } catch (err) {
    console.error("❌ [update.js] Error loading feeds.json:", err);
    return [];
  }
}

function countDaysSince(pubDate) {
  if (!pubDate) return 0;

  console.log(`📅 Calculating days since: ${pubDate}`);

  const published = new Date(pubDate);
  const now = new Date();

  // Handle invalid dates
  if (isNaN(published.getTime())) {
    console.warn("⚠️ Invalid pubDate:", pubDate);
    return 0;
  }

  const diffTime = now - published;
  const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  console.log(`📅 Result: ${days} days in testing`);
  return days;
}

export async function updateAllFeeds() {
  console.log("🚀 [update.js] Starting updateAllFeeds...");

  const feeds = await getApprovedFeeds();
  const apps = [];

  for (const url of feeds) {
    console.log(`\n🔄 Processing feed: ${url}`);
    try {
      const xml = await fetch(url + "?t=" + Date.now()).then(r => r.text());
      console.log(`📄 XML length: ${xml.length} chars`);

      const json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
        normalizeTags: true,
        tagNameProcessors: [(name) => name.replace(/^(app|dev|social):/, "").toLowerCase()],
        attrNameProcessors: [(name) => name.replace(/^(app|dev|social):/, "")]
      });

      const channel = json?.rss?.channel || json?.rss?.rss?.channel;
      if (!channel) {
        console.warn("⚠️ No channel found in XML");
        continue;
      }

      let items = channel.item;
      if (!Array.isArray(items)) items = items ? [items] : [];
      console.log(`📋 Found ${items.length} items`);

      for (const item of items) {
        const title = (item.title || "Unknown App").toString().trim();

        // Deep namespace fallback extraction
        const getField = (key) => {
          return item[key] || 
                 item[`app:${key}`] || 
                 item[key.toLowerCase()] || 
                 "";
        };

        const platform = getField("platform").toString().toLowerCase();
        if (platform && !platform.includes("android")) continue;

        const pubDate = item.pubDate || new Date().toISOString();
        const testingDuration = parseInt(getField("testingDuration") || "14", 10);
        const daysInTesting = countDaysSince(pubDate);
        const daysLeft = Math.max(0, testingDuration - daysInTesting);

        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `app-${Date.now()}`;

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
          status: getField("status") || (daysLeft > 0 ? "open-testing" : "testing-completed"),
          languages: extractArray(item.languages || item["app:languages"]),
          countries: extractArray(item.countries || item["app:countries"]),
          requirements: extractArray(item.requirements || item["app:requirements"])
        };

        console.log(`✅ Successfully parsed: ${appData.title}`);
        apps.push(appData);
      }
    } catch (err) {
      console.error(`❌ Failed processing ${url}:`, err.message);
    }
  }

  console.log(`🎉 TOTAL APPS PARSED: ${apps.length}`);
  
  return {
    generatedAt: new Date().toISOString(),
    apps: apps
  };
}

function extractArray(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") return field.split(",").map(s => s.trim()).filter(Boolean);

  // Handle nested <language>, <requirement>, etc.
  for (const key of ['language', 'requirement', 'country']) {
    if (field[key]) {
      const val = field[key];
      return Array.isArray(val) ? val : [val].filter(Boolean);
    }
  }
  return [];
}