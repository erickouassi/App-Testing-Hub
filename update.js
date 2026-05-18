import { parseStringPromise } from "xml2js";

const FEEDS_URL = "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/feeds.json";

async function getApprovedFeeds() {
  console.log("🔍 [update.js] Fetching approved feeds...");
  try {
    const res = await fetch(FEEDS_URL);
    const data = await res.json();
    console.log("✅ [update.js] Feeds found:", data.approvedFeeds?.length || 0);
    return data.approvedFeeds || [];
  } catch (err) {
    console.error("❌ [update.js] Error loading feeds.json:", err);
    return [];
  }
}

function countDaysSince(pubDate) {
  if (!pubDate) return 0;
  const published = new Date(pubDate);
  const now = new Date();
  const diff = now - published;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export async function updateAllFeeds() {
  console.log("🚀 [update.js] Starting updateAllFeeds...");

  const feeds = await getApprovedFeeds();
  const apps = [];

  for (const url of feeds) {
    console.log(`\n🔄 Processing feed: ${url}`);
    try {
      const xml = await fetch(url + "?t=" + Date.now()).then(r => r.text());
      console.log(`📄 XML fetched (${xml.length} chars)`);

      const json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
        normalizeTags: true,
        tagNameProcessors: [name => name.replace(/^(app|dev|social):/, "")],
        attrNameProcessors: [name => name.replace(/^(app|dev|social):/, "")]
      });

      const channel = json?.rss?.channel;
      if (!channel) {
        console.warn("⚠️ No <channel> found");
        continue;
      }

      const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
      console.log(`📋 Found ${items.length} <item>s`);

      for (const item of items) {
        // Extract fields with fallback for namespaced versions
        const title = item.title || "Unknown App";
        const pubDate = item.pubDate || new Date().toISOString();

        // Platform check
        let platform = (item.platform || "").toString().toLowerCase();
        if (!platform) platform = (item["app:platform"] || "").toString().toLowerCase();
        if (platform && platform !== "android") continue;

        const testingDuration = parseInt(
          item.testingDuration || item["app:testingDuration"] || "14", 10
        );

        const daysInTesting = countDaysSince(pubDate);
        const daysLeft = Math.max(0, testingDuration - daysInTesting);

        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `app-${Date.now()}`;

        const appData = {
          slug,
          title,
          description: item.description?._ || item.description || "",
          platform: "Android",
          version: item.version || item["app:version"] || "1.0.0",
          groupLink: item.groupLink || item["app:groupLink"] || "",
          testLink: item.testLink || item["app:testLink"] || "",
          pubDate,
          testingDuration,
          daysInTesting,
          daysLeft,
          status: item.status || item["app:status"] || (daysLeft > 0 ? "open-testing" : "testing-completed"),
          languages: extractArray(item.languages || item["app:languages"]),
          countries: extractArray(item.countries || item["app:countries"]),
          requirements: extractArray(item.requirements || item["app:requirements"])
        };

        console.log(`✅ Parsed app: ${appData.title}`);
        apps.push(appData);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${url}:`, err.message);
    }
  }

  console.log(`🎉 Total apps successfully parsed: ${apps.length}`);
  
  return {
    generatedAt: new Date().toISOString(),
    apps: apps
  };
}

function extractArray(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") return [field];

  // Handle nested XML arrays like <app:languages><app:language>...
  const possibleArrays = ['language', 'requirement', 'country'];
  for (const key of possibleArrays) {
    if (field[key]) {
      const val = field[key];
      return Array.isArray(val) ? val : [val].filter(Boolean);
    }
  }
  return [];
}