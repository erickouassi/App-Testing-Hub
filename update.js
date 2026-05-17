import { parseStringPromise } from "xml2js";

// External feed list
const FEEDS_URL = "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/feeds.json";

/* ------------------------------
   Load Approved Feeds
------------------------------ */
async function getApprovedFeeds() {
  try {
    const res = await fetch(FEEDS_URL);
    const data = await res.json();
    return data.approvedFeeds || [];
  } catch (err) {
    console.error("❌ Error loading feeds.json:", err);
    return [];
  }
}

/* ------------------------------
   Utility Functions
------------------------------ */
function countDaysSince(pubDate) {
  if (!pubDate) return 0;
  const published = new Date(pubDate);
  const now = new Date();
  const diff = now - published;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function calculateDaysLeft(daysInTesting, testingDuration) {
  return Math.max(0, testingDuration - daysInTesting);
}

function autoStatus(daysInTesting, daysLeft, developerStatus) {
  if (developerStatus) return developerStatus;

  if (daysInTesting <= 0) return "not-started";
  if (daysLeft <= 0) return "testing-completed";
  return "open-testing";
}

/* ------------------------------
   MAIN: updateAllFeeds()
------------------------------ */
export async function updateAllFeeds() {
  console.log("🚀 updateAllFeeds() started");

  const feeds = await getApprovedFeeds();

  if (!feeds.length) {
    console.log("⚠️ No feeds found in feeds.json");
    return { apps: [] };
  }

  const apps = [];

  for (const url of feeds) {
    console.log("🔵 Fetching:", url);

    let xml;
    try {
      xml = await fetch(url + "?t=" + Date.now()).then(r => r.text());
    } catch (err) {
      console.log("❌ Fetch error:", err);
      continue;
    }

    let json;
    try {
      json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
        tagNameProcessors: [
          name =>
            name
              .replace("app:", "")
              .replace("dev:", "")
              .replace("social:", "")
        ]
      });
    } catch (err) {
      console.log("❌ XML parse error:", err);
      continue;
    }

    const item = json?.rss?.channel?.item;
    if (!item) {
      console.log("❌ No <item> found in feed");
      continue;
    }

    /* ------------------------------
       Extract Core Fields
    ------------------------------ */
    const title = item.title || "";
    const description = item.description || "";
    const platformRaw = (item.platform || "").toLowerCase();

    // Android-only filtering
    if (platformRaw && platformRaw !== "android") {
      console.log("⏭ Skipping non-Android app:", title, platformRaw);
      continue;
    }

    const platform = "Android";
    const version = item.version || "";
    const groupLink = item.groupLink || "";
    const testLink = item.testLink || "";
    const pubDate = item.pubDate || "";
    const testingDuration = parseInt(item.testingDuration || "14", 10);
    const developerStatus = item.status || "";
    const groupMembers = parseInt(item.groupMembers || "0", 10);

    /* ------------------------------
       Extract Metadata Arrays
    ------------------------------ */
    const languages = Array.isArray(item.languages?.language)
      ? item.languages.language
      : item.languages?.language
      ? [item.languages.language]
      : [];

    const countries = Array.isArray(item.countries?.country)
      ? item.countries.country
      : item.countries?.country
      ? [item.countries.country]
      : [];

    const requirements = Array.isArray(item.requirements?.requirement)
      ? item.requirements.requirement
      : item.requirements?.requirement
      ? [item.requirements.requirement]
      : [];

    /* ------------------------------
       Compute Testing Progress
    ------------------------------ */
    const daysInTesting = countDaysSince(pubDate);
    const daysLeft = calculateDaysLeft(daysInTesting, testingDuration);
    const status =
      autoStatus(daysInTesting, daysLeft, developerStatus) ||
      "active-testing";

    /* ------------------------------
       Slug
    ------------------------------ */
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    console.log("🟢 Extracted:", {
      title,
      platform,
      version,
      groupLink,
      testLink,
      pubDate,
      testingDuration,
      daysInTesting,
      daysLeft,
      status,
      groupMembers,
      slug,
      languages,
      countries,
      requirements
    });

    /* ------------------------------
       Push Final App Object
    ------------------------------ */
    apps.push({
      title,
      description,
      platform,
      version,
      groupLink,
      testLink,
      pubDate,
      testingDuration,
      daysInTesting,
      daysLeft,
      status,
      groupMembers,
      slug,
      languages,
      countries,
      requirements
    });
  }

  /* ------------------------------
     Final Payload
  ------------------------------ */
  const payload = {
    generatedAt: new Date().toISOString(),
    apps
  };

  console.log("✅ Final apps:", apps);

  return payload;
}
