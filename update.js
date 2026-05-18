import { parseStringPromise } from "xml2js";

const FEEDS_URL =
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/feeds.json";

/* ---------------------------------------
   Load Approved Feeds
--------------------------------------- */
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

/* ---------------------------------------
   Helpers
--------------------------------------- */
function countDaysSince(pubDate) {
  if (!pubDate) return 0;
  const published = new Date(pubDate);
  const now = new Date();
  const diff = now - published;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/* ---------------------------------------
   MAIN: updateAllFeeds()
--------------------------------------- */
export async function updateAllFeeds() {
  const feeds = await getApprovedFeeds();
  const apps = [];

  for (const url of feeds) {
    try {
      const xml = await fetch(url + "?t=" + Date.now()).then((r) => r.text());

      const json = await parseStringPromise(xml, {
        explicitArray: true, // force arrays for repeated tags
        mergeAttrs: true,
        tagNameProcessors: [(name) => name.replace(/^(app|dev|social):/, "")]
      });

      /* ---------------------------------------
         Extract developer metadata
      --------------------------------------- */
      const dev = json?.rss?.channel?.developer?.[0] || {};
      const developer = {
        name: dev.name?.[0] || "Unknown Developer",
        email: dev.email?.[0] || "",
        website: dev.website?.[0] || "",
        socials: {
          reddit: dev.links?.[0]?.reddit?.[0] || "",
          facebook: dev.links?.[0]?.facebook?.[0] || "",
          github: dev.links?.[0]?.github?.[0] || "",
          discord: dev.links?.[0]?.discord?.[0] || "",
          twitter: dev.links?.[0]?.twitter?.[0] || "",
          youtube: dev.links?.[0]?.youtube?.[0] || ""
        }
      };

      /* ---------------------------------------
         Extract <item> nodes safely
      --------------------------------------- */
      const items = (json?.rss?.channel?.item || []).filter(
        (i) => i && typeof i === "object" && i.title
      );

      /* ---------------------------------------
         Process each app item
      --------------------------------------- */
      for (const item of items) {
        const platformRaw = String(item.platform?.[0] || "").toLowerCase();
        if (platformRaw !== "android") continue;

        const title = item.title?.[0] || "Unknown App";
        const pubDate = item.pubDate?.[0] || new Date().toISOString();
        const testingDuration = parseInt(item.testingDuration?.[0] || "14", 10);
        const daysInTesting = countDaysSince(pubDate);
        const daysLeft = Math.max(0, testingDuration - daysInTesting);

        /* ---------------------------------------
           Description (handles CDATA + multiline)
        --------------------------------------- */
        const description =
          typeof item.description?.[0] === "string"
            ? item.description[0].trim()
            : item.description?.[0]?._?.trim() || "";

        /* ---------------------------------------
           Arrays: requirements, languages, countries
        --------------------------------------- */
        const requirements = item.requirements?.[0]?.requirement || [];
        const languages = item.languages?.[0]?.language || [];
        const countries = item.countries?.[0]?.country || [];

        /* ---------------------------------------
           Final App Object
        --------------------------------------- */
        apps.push({
          title,
          description,
          platform: "Android",
          version: item.version?.[0] || "1.0.0",
          groupLink: item.groupLink?.[0] || "",
          testLink: item.testLink?.[0] || "",
          pubDate,
          testingDuration,
          daysInTesting,
          daysLeft,
          status:
            item.status?.[0] ||
            (daysLeft > 0 ? "open-testing" : "testing-completed"),
          slug: title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          requirements,
          languages,
          countries,
          developer
        });
      }
    } catch (err) {
      console.error(`❌ Skip feed ${url}:`, err);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    apps
  };
}
